# bun-storage

> A ponyfill for the Storage API, utilizing SQLite

[![License](https://img.shields.io/github/license/idleberg/bun-storage?color=blue&style=for-the-badge)](https://github.com/idleberg/bun-storage/blob/main/LICENSE)
[![Version: npm](https://img.shields.io/npm/v/bun-storage?style=for-the-badge)](https://www.npmjs.org/package/bun-storage)
[![Version: jsr](https://img.shields.io/jsr/v/@idleberg/bun-storage?style=for-the-badge)](https://jsr.io/@idleberg/bun-storage)
[![Build](https://img.shields.io/github/actions/workflow/status/idleberg/bun-storage/test.yml?style=for-the-badge)](https://github.com/idleberg/bun-storage/actions)

## Features

-   zero dependencies
-   fully API compatible to both, `localStorage` and `sessionStorage`
-   persists data across sessions
-   supports `storage` events

## Installation

```sh
# npm
bun install bun-storage

# JSR
bunx jsr add @idleberg/bun-storage
```

## Usage

For simple use cases, the automatic setup will expose both, `sessionStorage` and `localStorage` on the global object. The location of the database defaults to `.bun-storage/localStorage.sqlite`. However, you won't be able to listen to storage events.

```typescript
import 'bun-storage/auto';
```

If you need more control, see the API documentation below.

### API

#### `createLocalStorage`

Usage: `createLocalStorage(dbFile: string)`  
Returns: `[Storage, EventEmitter]`

Creates an instance of the [`localStorage`][] API, and a corresponding EventEmitter.

**Example:**

```typescript
import { createLocalStorage } from "bun-storage";

const [localStorage, emitter] = createLocalStorage("./db.sqlite");

// Listen for storage changes
emitter.on("storage", console.log);
```

#### `createSessionStorage`

Usage: `createSessionStorage()`  
Returns: `[Storage, EventEmitter]`

Creates an instance of the [`sessionStorage`][] API, and a corresponding EventEmitter.

**Example:**

```typescript
import { createSessionStorage } from "bun-storage";

const [sessionStorage, emitter] = createSessionStorage();

// Listen for storage changes
emitter.on("storage", console.log);
```

#### `createStorages`

Usage: `createStorages(dbFile: string)`  
Returns: `{ sessionStorage: Storage, localStorage: Storage, emitter: EventEmitter }`

Creates instances of both, [`sessionStorage`][] and [`localStorage`][], as well as a corresponding EventEmitter.

**Example:**

```typescript
import { createStorages } from "bun-storage";

const { sessionStorage, localStorage, emitter } = createStorages("./db.sqlite");

// Listen for storage changes
emitter.on("storage", console.log);
```

#### `Storage` (Advanced Usage)

Usage: `new Storage(filePath: string | ':memory:', options: StorageEventOptions)`

This class is used internally by the above factory functions. Instantiating it class allows you more control over the EventEmitter, e.g. you could re-use an existing one from your application code.

**Example:**

```typescript
import { Storage } from "bun-storage";
import EventEmitter from "events";

const myEmitter = new EventEmitter();

const localStorage = new Storage("./db.sqlite", {
    emitter: myEmitter,
});

// Listen for storage changes
myEmitter.on("storage", console.log);
```

## Related

-   [@idleberg/local-storage](https://www.npmjs.com/package/@idleberg/local-storage): a NodeJS implementation of this package

## License

This work is licensed under [The MIT License](https://opensource.org/licenses/MIT).

[`localStorage`]: https://developer.mozilla.org/docs/Web/API/Window/localStorage
[`sessionStorage`]: https://developer.mozilla.org/docs/Web/API/Window/sessionStorage
