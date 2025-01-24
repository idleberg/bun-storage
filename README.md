# bun-storage

> A ponyfill for the Storage API, utilizing SQLite

[![License](https://img.shields.io/github/license/idleberg/bun-storage?color=blue&style=for-the-badge)](https://github.com/idleberg/bun-storage/blob/main/LICENSE)
[![Version](https://img.shields.io/npm/v/bun-storage?style=for-the-badge)](https://www.npmjs.org/package/bun-storage)
[![Build](https://img.shields.io/github/actions/workflow/status/idleberg/bun-storage/test.yml?style=for-the-badge)](https://github.com/idleberg/bun-storage/actions)

## Installation

`bun install bun-storage`

## Usage

**Example:**

```js
import { createLocalStorage, createSessionStorage } from 'bun-storage';

const [ localStorage, localStorageEmitter ] = createLocalStorage('./db.sqlite');
const [ sessionStorage, sessionStorageEmitter ] = createSessionStorage();

// Listen for storage changes
localStorageEmitter.addListener('storage', console.log);
sessionStorageEmitter.addListener('storage', console.log);
```

## API

### localStorage

`createLocalStorage(dbFile: string)`

### sessionStorage

`createSessionStorage()`

## License

This work is licensed under [The MIT License](https://opensource.org/licenses/MIT).
