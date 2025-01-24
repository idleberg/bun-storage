import { beforeEach, expect, test } from 'bun:test';
import { createLocalStorage, createSessionStorage } from './index.ts';

// Helpers
import { randomUUID } from "node:crypto";
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';

const dbFile = resolve(tmpdir(), `${randomUUID()}.sqlite`);

const [localStorage, localStorageEmitter] = createLocalStorage(dbFile);
const [sessionStorage, sessionStorageEmitter] = createSessionStorage();

[
	{
		type: 'localStorage',
		storage: localStorage,
		emitter: localStorageEmitter
	},
	{
		type: 'sessionStorage',
		storage: sessionStorage,
		emitter: sessionStorageEmitter
	}
].map(({ type, storage, emitter }) => {
	beforeEach(() => {
		emitter.removeAllListeners();
		storage.clear();
	});

	test(`${type}.clear()`, () => {
		emitter.addListener('storage', data => {
			expect(data).toEqual({
				key: null,
				newValue: null,
				oldValue: null,
				storageArea: {},
				url: undefined,
			})
		});

		storage.clear();
	});

	test(`${type}.setItem()`, () => {
		const key = randomUUID();

		emitter.addListener('storage', data => {
			expect(data).toEqual({
				key: 'demo',
				newValue: key,
				oldValue: null,
				storageArea: {
					'demo': key
				},
				url: undefined,
			})
		});

		storage.setItem('demo', key);
	});

	test(`${type}.removeItem()`, () => {
		const key = randomUUID();
		storage.setItem('demo', key);

		emitter.addListener('storage', data => {
			expect(data).toEqual({
				key: 'demo',
				newValue: null,
				oldValue: key,
				storageArea: {},
				url: undefined,
			})
		});

		storage.removeItem('demo');
	});
});
