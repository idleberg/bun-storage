import { access, constants, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { createStorages } from './index.ts';

const STORAGE_DIR = join(cwd(), '.bun-storage');

async function createStorageDirectory() {
	if (!(await storageDirectoryExists())) {
		await mkdir(STORAGE_DIR);
	}
}

async function storageDirectoryExists() {
	try {
		await access(STORAGE_DIR, constants.F_OK);
	} catch {
		return false;
	}

	return true;
}

function initStorages() {
	const { localStorage, sessionStorage } = createStorages('.bun-storage/localStorage.sqlite');

	globalThis.localStorage = localStorage;
	globalThis.sessionStorage = sessionStorage;
}

async function main() {
	await createStorageDirectory();
	initStorages();
}

/**
 * The Bun REPL fails on top-level await, but that's okay to omit the keyword.
 */
main();
