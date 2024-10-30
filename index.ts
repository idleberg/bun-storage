import { Database } from 'bun:sqlite';

if (!process.versions.bun) {
	throw ReferenceError('This library only runs using the Bun runtime. Find out more at https://bun.sh/');
}

type Storage = {
	clear(): void;
	getItem(keyName: string): string | null;
	key(index: unknown): string | null;
	readonly length: number;
	removeItem(keyName: string): void;
	setItem(keyName: string, keyValue: unknown): void;
};

type KeyValuePair = {
	key: string;
	value: string;
};

/**
 * Returns an instance of `localStorage` that uses a SQLite database file to store data.
 * @param fileName path to the SQLite database file
 * @returns
 */
export function createLocalStorage(fileName: string): Storage {
	const db = new Database(fileName, {
		create: true,
	});

	db.exec('CREATE TABLE IF NOT EXISTS kv (key text unique, value text)');

	process.on('exit', () => {
		// This should not be necessary
		if (fileName === ':memory:') {
			db.prepare('DELETE FROM kv').run();
		}

		db.close();
	});

	return {
		/**
		 * The `clear()` method of the `Storage` interface clears all keys stored in a given `Storage` object.
		 */
		clear(): void {
			db.prepare('DELETE FROM kv').run();
		},

		/**
		 * The `getItem()` method of the `Storage` interface, when passed a key name, will return that key's value, or null if the key does not exist, in the given `Storage` object.
		 * @param {string} keyName A string containing the name of the key you want to retrieve the value of.
		 * @returns {string | null} A string containing the value of the key. If the key does not exist, `null` is returned.
		 */
		getItem(keyName: string): string | null {
			try {
				const item = db.prepare('SELECT value FROM kv WHERE key = ?').get(keyName) as KeyValuePair;

				return item['value'];
			} catch (error) {
				return null;
			}
		},

		/**
		 * The key() method of the Storage interface, when passed a number n, returns the name of the nth key in a given Storage object. The order of keys is user-agent defined, so you should not rely on it.
		 * @param {number} index An integer representing the number of the key you want to get the name of. This is a zero-based index.
		 * @returns {string | null} A string containing the name of the key. If the index does not exist, null is returned.
		 */
		key(index: unknown): string | null {
			const normalizedIndex = parseInt(String(index), 10) || 0;
			const query = db.prepare('SELECT key FROM kv ORDER BY key LIMIT 1 OFFSET ?');
			const item = query.get(normalizedIndex) as KeyValuePair;

			return item ? item.key : null;
		},

		/**
		 * The `length` read-only property of the Storage interface returns the number of data items stored in a given `Storage` object.
		 * @returns {number} The number of items stored in the `Storage` object.
		 */
		get length(): number {
			const rows = db.prepare('SELECT COUNT(*) FROM kv').get() as Record<string, string>;

			return parseInt(rows['COUNT(*)'], 10) || 0;
		},

		/**
		 * The `removeItem()` method of the `Storage` interface, when passed a key name, will remove that key from the given `Storage` object if it exists. The `Storage` interface of the Web Storage API provides access to a particular domain's session or local storage.
		 * @param {string} keyName A string containing the name of the key you want to remove.
		 */
		removeItem(keyName: string): void {
			db.prepare('DELETE FROM kv WHERE key = ?').run(keyName);
		},

		/**
		 * The setItem() method of the Storage interface, when passed a key name and value, will add that key to the given Storage object, or update that key's value if it already exists.
		 * @param {string} keyName A string containing the name of the key you want to create/update.
		 * @param {string} keyValue A string containing the value you want to give the key you are creating/updating.
		 */
		setItem(keyName: string, keyValue: unknown): void {
			db.prepare('REPLACE INTO kv (key, value) VALUES (?, ?)').run(String(keyName), String(keyValue));
		},
	};
}

/**
 * Returns an instance of `sessionStorage` that uses a memory to store data.
 * @returns
 */
export function createSessionStorage(): Storage {
	return createLocalStorage(':memory:');
}
