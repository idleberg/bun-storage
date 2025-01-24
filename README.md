# bun-storage

> A ponyfill for the Storage API, utilizing SQLite

[![License](https://img.shields.io/github/license/idleberg/bun-storage?color=blue&style=for-the-badge)](https://github.com/idleberg/bun-storage/blob/main/LICENSE)
[![Version](https://img.shields.io/npm/v/bun-storage?style=for-the-badge)](https://www.npmjs.org/package/bun-storage)
[![Build](https://img.shields.io/github/actions/workflow/status/idleberg/bun-storage/test.yml?style=for-the-badge)](https://github.com/idleberg/bun-storage/actions)

## Installation

`bun install bun-storage`

## Usage

## API

### createLocalStorage

Usage: `createLocalStorage(dbFile: string)`  
Returns: `[Storage, EventEmitter]`  

Creates an instance of the [`localStorage`](https://developer.mozilla.org/docs/Web/API/Window/localStorage) API and a corresponding EventEmitter.

**Example:**

```typescript
import { createLocalStorage } from 'bun-storage';

const [ localStorage, emitter ] = createLocalStorage('./db.sqlite');

// Listen for storage changes
emitter.addListener('storage', console.log);
```
### createSessionStorage

Usage: `createSessionStorage()`  
Returns: `[Storage, EventEmitter]`  

Creates an instance of the [`sessionStorage`](https://developer.mozilla.org/docs/Web/API/Window/sessionStorage) API and a corresponding EventEmitter.

**Example:**

```typescript
import { createSessionStorage } from 'bun-storage';

const [ sessionStorage, emitter ] = createSessionStorage();

// Listen for storage changes
emitter.addListener('storage', console.log);
```

### Storage

Usage: `new Storage(filePath: string | ':memory:', options: StorageEventOptions)`

This class is used internally by both of the above factory functions. However, instanting the class allows you more control over the EventEmitter, i.e. you pass an existing one from your application code.

**Example:**

```typescript
import { Storage } from 'bun-storage';
import EventEmitter from 'events';

const myEmitter = new EventEmitter();

const localStorage = new Storage('./db.sqlite', {
	emitter: myEmitter
});

// Listen for storage changes
myEmitter.addListener('storage', console.log);
```

## License

This work is licensed under [The MIT License](https://opensource.org/licenses/MIT).
