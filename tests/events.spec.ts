import { beforeEach, expect, test } from 'bun:test';
// Helpers
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createLocalStorage, createSessionStorage, createStorages } from '../index.ts';

const dbFile = resolve(tmpdir(), `${randomUUID()}.sqlite`);

const [localStorage, localStorageEmitter] = createLocalStorage(dbFile);
const [sessionStorage, sessionStorageEmitter] = createSessionStorage();
const storages = createStorages(dbFile);

[
	{
		type: 'localStorage',
		storage: localStorage,
		emitter: localStorageEmitter,
	},
	{
		type: 'sessionStorage',
		storage: sessionStorage,
		emitter: sessionStorageEmitter,
	},
	{
		type: 'storages.localStorage',
		storage: storages.localStorage,
		emitter: storages.emitter,
	},
	{
		type: 'storages.sessionStorage',
		storage: storages.sessionStorage,
		emitter: storages.emitter,
	},
].map(({ type, storage, emitter }) => {
	beforeEach(() => {
		emitter.removeAllListeners();
		storage.clear();
	});

	test(`${type}.clear()`, async () => {
		await new Promise<void>((resolve, reject) => {
			emitter.addListener('storage', (data) => {
				try {
					expect(data).toEqual({
						key: null,
						newValue: null,
						oldValue: null,
						storageArea: {},
						url: undefined,
					});
					resolve();
				} catch (error) {
					reject(error);
				}
			});

			storage.clear();
		});
	});

	test(`${type}.setItem()`, async () => {
		const key = randomUUID();

		await new Promise<void>((resolve, reject) => {
			emitter.addListener('storage', (data) => {
				try {
					expect(data).toEqual({
						key: 'demo',
						newValue: key,
						oldValue: null,
						storageArea: {
							demo: key,
						},
						url: undefined,
					});
					resolve();
				} catch (error) {
					reject(error);
				}
			});

			storage.setItem('demo', key);
		});
	});

	test(`${type}.removeItem()`, async () => {
		const key = randomUUID();
		storage.setItem('demo', key);

		await new Promise<void>((resolve, reject) => {
			emitter.addListener('storage', (data) => {
				try {
					expect(data).toEqual({
						key: 'demo',
						newValue: null,
						oldValue: key,
						storageArea: {},
						url: undefined,
					});
					resolve();
				} catch (error) {
					reject(error);
				}
			});

			storage.removeItem('demo');
		});
	});
});
