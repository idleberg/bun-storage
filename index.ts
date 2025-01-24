import { Database } from 'bun:sqlite';
import EventEmitter from 'events';

if (!process.versions.bun) {
	throw ReferenceError('This library only runs using the Bun runtime. Find out more at https://bun.sh/');
}

type KeyValuePair = {
	key: string;
	value: string;
};

type EventOptions = {
	emitter?: EventEmitter;
};

export class Storage {
	#db: Database;
	#eventEmitter?: EventEmitter;

	constructor(fileName: string, options: EventOptions = {}) {
		if (options.emitter && !(options.emitter instanceof EventEmitter)) {
			throw new TypeError('The emitter option must be an instance of EventEmitter');
		}

		this.#eventEmitter = options.emitter;

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
	getItem(keyName: string): string | null {
		try {
			const item = this.#db.prepare('SELECT value FROM kv WHERE key = ?').get(keyName) as KeyValuePair;

			return item['value'];
		} catch (error) {
			return null;
		}
	}

	/**
	 * The key() method of the Storage interface, when passed a number n, returns the name of the nth key in a given Storage object. The order of keys is user-agent defined, so you should not rely on it.
	 * @param index An integer representing the number of the key you want to get the name of. This is a zero-based index.
	 * @returns A string containing the name of the key. If the index does not exist, null is returned.
	 */
	key(index: unknown): string | null {
		const normalizedIndex = parseInt(String(index), 10) || 0;
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

		return parseInt(rows['COUNT(*)'], 10) || 0;
	}

	/**
	 * The `removeItem()` method of the `Storage` interface, when passed a key name, will remove that key from the given `Storage` object if it exists. The `Storage` interface of the Web Storage API provides access to a particular domain's session or local storage.
	 * @param keyName A string containing the name of the key you want to remove.
	 */
	removeItem(keyName: string): void {
		const oldValue = this.getItem(keyName);

		this.#db.prepare('DELETE FROM kv WHERE key = ?').run(keyName);

		this.#dispatchEvent(keyName, null, oldValue);
	}

	/**
	 * The setItem() method of the Storage interface, when passed a key name and value, will add that key to the given Storage object, or update that key's value if it already exists.
	 * @param keyName A string containing the name of the key you want to create/update.
	 * @param keyValue A string containing the value you want to give the key you are creating/updating.
	 */
	setItem(keyName: string, keyValue: unknown): void {
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
		if (!this.#eventEmitter) {
			return;
		}

		const storageArea = this.#db.prepare('SELECT key, value FROM kv').all() as KeyValuePair[];

		this.#eventEmitter.emit('storage', {
			key: key === null ? null : key,
			newValue: newValue === null ? null : String(newValue),
			oldValue,
			storageArea: Object.fromEntries(storageArea.map(({ key, value }) => ([key, value]))),
			url: undefined,
		});
	}
};

/**
 * Returns an instance of `localStorage` that uses a SQLite database file to store data.
 * @param fileName path to the SQLite database file
 * @returns
 */
export function createLocalStorage(fileName: string): [Storage, EventEmitter] {
	const emitter = createEventEmitter();

	const api = new Storage(fileName, {
		emitter
	});

	return [
		api,
		emitter
	];
}

/**
 * Returns an instance of `sessionStorage` that uses a memory to store data.
 * @returns
*/
export function createSessionStorage(): [Storage, EventEmitter] {
	const emitter = createEventEmitter();

	const api = new Storage(':memory:', {
		emitter,
	});

	return [
		api,
		emitter
	];
}

function createEventEmitter(): EventEmitter {
	class StorageEventEmitter extends EventEmitter { };

	return new StorageEventEmitter();
}
