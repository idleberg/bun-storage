// deno-lint-ignore-file
import { Database } from 'bun:sqlite';
import EventEmitter from 'node:events';
import process from 'node:process';

type KeyValuePair = {
	key: string;
	value: string;
};

/**
 * Options for creating storage instances.
 */
export interface StorageFactoryOptions {
	/**
	 * Storage quota in bytes. When set, enforces browser-like storage limits (e.g., 5MB).
	 */
	quota?: number;
}

/**
 * Options for the Storage class constructor.
 */
export interface StorageClassOptions extends StorageFactoryOptions {
	/**
	 * An instance of EventEmitter to use for dispatching storage events.
	 */
	emitter: EventEmitter;

	/**
	 * The name of the event to dispatch when a storage event occurs. Defaults to `storage`.
	 */
	eventName?: string;
}

/**
 * A ponyfill for both, the `localStorage` and `sessionStorage`, APIs using SQLite as the underlying storage mechanism.
 */
export class Storage {
	#db: Database;
	#emitter: EventEmitter;
	#eventName = 'storage';
	#quota?: number;

	/**
	 * Creates a new instance of `Storage`, a ponyfill for both, the `localStorage` and `sessionStorage`, APIs.
	 * @param fileName Path to the SQLite database file, or `:memory:` to act like `sessionStorage`.
	 * @param options Configuration options for the storage instance.
	 * @throws {TypeError} If the `emitter` option is not an instance of `EventEmitter`.
	 */
	constructor(fileName: string | ':memory:', options: StorageClassOptions) {
		if (!(options.emitter instanceof EventEmitter)) {
			throw new TypeError('The emitter option must be an instance of EventEmitter.');
		}

		this.#emitter = options.emitter;
		this.#eventName = options?.eventName || 'storage';
		this.#quota = options?.quota;

		this.#db = new Database(fileName, {
			create: true,
		});

		this.#db.run('CREATE TABLE IF NOT EXISTS kv (key text unique, value text)');

		process.on('exit', () => {
			// This should not be necessary
			if (fileName === ':memory:') {
				this.#db.prepare('DELETE FROM kv').run();
			}

			this.#db.close();
		});
	}

	/**
	 * The `clear()` method of the `Storage` interface clears all keys stored in a given `Storage` object.
	 */
	clear(): void {
		this.#db.prepare('DELETE FROM kv').run();

		this.#dispatchEvent(null, null, null);
	}

	/**
	 * The `getItem()` method of the `Storage` interface, when passed a key name, will return that key's value, or null if the key does not exist, in the given `Storage` object.
	 * @param keyName A string containing the name of the key you want to retrieve the value of.
	 * @returns A string containing the value of the key. If the key does not exist, `null` is returned.
	 */
	getItem(...args: [keyName: string]): string | null {
		if (args.length !== 1) {
			throw new TypeError(
				`Failed to execute "getItem" on "${this.constructor.name}": 1 arguments required, but only ${args.length} present.`,
			);
		}

		const [keyName] = args;

		try {
			const item = this.#db.prepare('SELECT value FROM kv WHERE key = ?').get(keyName) as KeyValuePair;

			return item.value;
		} catch {
			return null;
		}
	}

	/**
	 * The key() method of the Storage interface, when passed a number n, returns the name of the nth key in a given Storage object. The order of keys is user-agent defined, so you should not rely on it.
	 * @param index An integer representing the number of the key you want to get the name of. This is a zero-based index.
	 * @returns A string containing the name of the key. If the index does not exist, null is returned.
	 */
	key(...args: [keyName: unknown]): string | null {
		if (args.length !== 1) {
			throw new TypeError(
				`Failed to execute "key" on "${this.constructor.name}": 1 arguments required, but only ${args.length} present.`,
			);
		}

		const [index] = args;

		const normalizedIndex = Number.parseInt(String(index), 10) || 0;
		const query = this.#db.prepare('SELECT key FROM kv ORDER BY key LIMIT 1 OFFSET ?');
		const item = query.get(normalizedIndex) as KeyValuePair;

		return item ? item.key : null;
	}

	/**
	 * The `length` read-only property of the Storage interface returns the number of data items stored in a given `Storage` object.
	 * @returns The number of items stored in the `Storage` object.
	 */
	get length(): number {
		const rows = this.#db.prepare('SELECT COUNT(*) FROM kv').get() as Record<string, string>;
		const rowCount = rows['COUNT(*)'] ?? '0';

		return Number.parseInt(rowCount, 10);
	}

	/**
	 * The `removeItem()` method of the `Storage` interface, when passed a key name, will remove that key from the given `Storage` object if it exists. The `Storage` interface of the Web Storage API provides access to a particular domain's session or local storage.
	 * @param keyName A string containing the name of the key you want to remove.
	 */
	removeItem(...args: [keyName: string]): void {
		if (args.length !== 1) {
			throw new TypeError(
				`Failed to execute "removeItem" on "${this.constructor.name}": 1 arguments required, but only ${args.length} present.`,
			);
		}

		const [keyName] = args;

		const oldValue = this.getItem(keyName);

		this.#db.prepare('DELETE FROM kv WHERE key = ?').run(keyName);

		this.#dispatchEvent(keyName, null, oldValue);
	}

	/**
	 * The setItem() method of the Storage interface, when passed a key name and value, will add that key to the given Storage object, or update that key's value if it already exists.
	 * @param keyName A string containing the name of the key you want to create/update.
	 * @param keyValue A string containing the value you want to give the key you are creating/updating.
	 * @throws {DOMException} QuotaExceededError if the operation would exceed the storage quota.
	 */
	setItem(...args: [keyName: string, keyValue: unknown]): void {
		if (args.length !== 2) {
			throw new TypeError(
				`Failed to execute "setItem" on "${this.constructor.name}": 2 arguments required, but only ${args.length} present.`,
			);
		}

		const [keyName, keyValue] = args;
		const oldValue = this.getItem(keyName);

		// Check quota if set
		if (this.#quota !== undefined) {
			const currentSize = this.#calculateSize();
			const oldSize = oldValue ? (String(keyName).length + oldValue.length) * 2 : 0;
			const newSize = (String(keyName).length + String(keyValue).length) * 2;
			const totalSize = currentSize - oldSize + newSize;

			if (totalSize > this.#quota) {
				const error = new Error(
					`Failed to execute 'setItem' on 'Storage': Setting the value of '${keyName}' exceeded the quota.`,
				);
				error.name = 'QuotaExceededError';

				throw error;
			}
		}

		this.#db.prepare('REPLACE INTO kv (key, value) VALUES (?, ?)').run(String(keyName), String(keyValue));

		this.#dispatchEvent(keyName, keyValue, oldValue);
	}

	/**
	 * Calculates the current storage size in bytes.
	 * Both keys and values are counted using UTF-16 encoding (2 bytes per character).
	 * @private
	 * @returns The total size in bytes.
	 */
	#calculateSize(): number {
		const items = this.#db.prepare('SELECT key, value FROM kv').all() as KeyValuePair[];
		return items.reduce((total, { key, value }) => total + (key.length + value.length) * 2, 0);
	}

	/**
	 * Dispatches a storage event using the provided event emitter.
	 * @private
	 * @param key The key that was changed. If `null`, all keys were changed.
	 * @param newValue The new value of the key.
	 * @param oldValue The old value of the key.
	 */
	#dispatchEvent(key: string | null, newValue: unknown, oldValue: string | null) {
		const storageArea = this.#db.prepare('SELECT key, value FROM kv').all() as KeyValuePair[];

		this.#emitter.emit(this.#eventName, {
			key: key === null ? null : key,
			newValue: newValue === null ? null : String(newValue),
			oldValue,
			storageArea: Object.fromEntries(storageArea.map(({ key, value }) => [key, value])),
			url: undefined,
		});
	}
}

/**
 * Returns instances of both, `sessionStorage` and `localStorage`, and a corresponding EventEmitter.
 * @param fileName path to the SQLite database file, or `:memory:` to use in-memory storage
 * @param options Optional configuration object
 * @param options.quota Optional storage quota in bytes (e.g., 5 * 1024 * 1024 for 5MB)
 * @returns an object containing both storage interfaces and event emitter
 */
export function createStorage(
	fileName = ':memory:',
	options?: StorageFactoryOptions,
): {
	sessionStorage: Storage;
	localStorage: Storage;
	emitter: EventEmitter;
} {
	const emitter = new EventEmitter();

	const sessionStorage = new Storage(':memory:', {
		emitter,
		quota: options?.quota,
	});

	const localStorage = new Storage(fileName, {
		emitter,
		quota: options?.quota,
	});

	return { sessionStorage, localStorage, emitter };
}
