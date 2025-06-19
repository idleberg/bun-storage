import { Database } from 'bun:sqlite';
import EventEmitter from 'node:events';

if (!process.versions.bun) {
	throw ReferenceError('This library only runs using the Bun runtime. Find out more at https://bun.sh/.');
}

type KeyValuePair = {
	key: string;
	value: string;
};

type EventOptions = {
	emitter: EventEmitter;
	eventName?: string;
};

export class Storage {
	#db: Database;
	#emitter: EventEmitter;
	#eventName = 'storage';

	/**
	 * Creates a new instance of `Storage`, a ponyfill for both, the `localStorage` and `sessionStorage`, APIs.
	 * @param fileName path to the SQLite database file, or `:memory:` to act like `sessionStorage`.
	 * @param options An object containing options for the event emitter.
	 * @param options.emitter An instance of `EventEmitter` to use for dispatching storage events.
	 * @param options.eventName The name of the event to dispatch when a storage event occurs. Defaults to `storage`.
	 * @throws {TypeError} If the `emitter` option is provided and is not an instance of `EventEmitter`.
	 * @returns A new instance of `Storage`.
	 */
	constructor(fileName: string | ':memory:', options: EventOptions) {
		if (!(options.emitter instanceof EventEmitter)) {
			throw new TypeError('The emitter option must be an instance of EventEmitter.');
		}

		this.#emitter = options.emitter;
		this.#eventName = options?.eventName || 'storage';

		this.#db = new Database(fileName, {
			create: true,
		});

		this.#db.exec('CREATE TABLE IF NOT EXISTS kv (key text unique, value text)');

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
		} catch (error) {
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

		return Number.parseInt(rows['COUNT(*)'], 10) || 0;
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
	 */
	setItem(...args: [keyName: string, keyValue: unknown]): void {
		if (args.length !== 2) {
			throw new TypeError(
				`Failed to execute "setItem" on "${this.constructor.name}": 2 arguments required, but only ${args.length} present.`,
			);
		}

		const [keyName, keyValue] = args;
		const oldValue = this.getItem(keyName);

		this.#db.prepare('REPLACE INTO kv (key, value) VALUES (?, ?)').run(String(keyName), String(keyValue));

		this.#dispatchEvent(keyName, keyValue, oldValue);
	}

	/**
	 * Dispatches a storage event using the provided event emitter.
	 * @private
	 * @param key The key that was changed. If `null`, all keys were changed.
	 * @param newValue The new value of the key.
	 * @param oldValue The old value of the key.
	 */
	#dispatchEvent(key: string | null, newValue: unknown, oldValue: string | null) {
		if (!this.#emitter) {
			return;
		}

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
 * Returns an instance of `localStorage` that uses a SQLite database file to store data.
 * @param fileName path to the SQLite database file
 * @returns
 */
export function createLocalStorage(fileName: string): [Storage, EventEmitter] {
	const emitter = new EventEmitter();

	const storage = new Storage(fileName, {
		emitter,
	});

	return [storage, emitter];
}

/**
 * Returns an instance of `sessionStorage` that uses memory to store data.
 * @returns
 */
export function createSessionStorage(): [Storage, EventEmitter] {
	const emitter = new EventEmitter();

	const storage = new Storage(':memory:', {
		emitter,
	});

	return [storage, emitter];
}
