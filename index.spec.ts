import { beforeEach, expect, test } from 'bun:test';
import { createLocalStorage } from './index.js';

const localStorage = createLocalStorage('./db.sqlite');

beforeEach(() => {
	localStorage.clear();
});

test('clear()', () => {
	localStorage.setItem('demo', 'Hello, world!');
	localStorage.clear();

	const actual = localStorage.getItem('demo');
	const expected = null;

	expect(actual).toBe(expected);
});

test('key() - Valid Index', () => {
	const expected = 'Hello, world';
	localStorage.setItem('demo', expected);

	const actual = localStorage.key(0);

	expect(actual).toBe(expected);
});

test('key() - Invalid Index', () => {
	localStorage.setItem('demo', 'Hello, world');

	const actual = localStorage.key(1);

	expect(actual).toBe(null);
});

test('key() - Float Index', () => {
	const expected = 'Hello, world';
	localStorage.setItem('demo', expected);

	const actual = localStorage.key(0.1);

	expect(actual).toBe(expected);
});

test('length() - 0', () => {
	localStorage.setItem('demo', 'Hello, world!');
	localStorage.clear();

	const actual = localStorage.length;
	const expected = 0;

	expect(actual).toBe(expected);
});

test('length() - 1', () => {
	localStorage.setItem('demo', 'Hello, world!');

	const actual = localStorage.length;
	const expected = 1;

	expect(actual).toBe(expected);
});

test('removeItem()', () => {
	localStorage.setItem('demo', 'Hello, world!');
	localStorage.removeItem('demo');
	const actual = localStorage.getItem('demo');

	expect(actual).toBe(null);
});

test('*etItem() - String', () => {
	const expected = 'Hello, world!';
	localStorage.setItem('demo', expected);
	const actual = localStorage.getItem('demo');

	expect(actual).toBe(expected);
});

test('*etItem() - Number', () => {
	const expected = 1;
	localStorage.setItem('demo', expected);
	const actual = localStorage.getItem('demo');

	expect(actual).toBe(String(expected));
});

test('*etItem() - Boolean', () => {
	const expected = true;
	localStorage.setItem('demo', expected);
	const actual = localStorage.getItem('demo');

	expect(actual).toBe(String(expected));
});

test('*etItem() - Null', () => {
	const expected = null;
	localStorage.setItem('demo', expected);
	const actual = localStorage.getItem('demo');

	expect(actual).toBe(String(expected));
});

test('*etItem() - Object', () => {
	const expected = {};
	localStorage.setItem('demo', expected);
	const actual = localStorage.getItem('demo');

	expect(actual).toBe(String(expected));
});

test('*etItem() - Undefined', () => {
	const expected = undefined;
	localStorage.setItem('demo', expected);
	const actual = localStorage.getItem('demo');

	expect(actual).toBe(String(expected));
});

test('*etItem() - BigInt', () => {
	const expected = BigInt('1');
	localStorage.setItem('demo', expected);
	const actual = localStorage.getItem('demo');

	expect(actual).toBe(String(expected));
});

test('*etItem() - Symbol', () => {
	const expected = Symbol('foo');
	localStorage.setItem('demo', expected);
	const actual = localStorage.getItem('demo');

	expect(actual).toBe(String(expected));
});
