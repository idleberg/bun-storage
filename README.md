# is-cson

> Determines whether a string is valid CSON

[![License](https://img.shields.io/github/license/idleberg/node-is-cson?color=blue&style=for-the-badge)](https://github.com/idleberg/node-is-cson/blob/main/LICENSE)
[![Version](https://img.shields.io/npm/v/is-cson?style=for-the-badge)](https://www.npmjs.org/package/is-cson)
[![Build](https://img.shields.io/github/actions/workflow/status/idleberg/node-is-cson/default.yml?style=for-the-badge)](https://github.com/idleberg/node-is-cson/actions)

## Installation

`npm install is-cson -S`

## Usage

`isCSON(string, options?)`

**Example:**

```js
import { isCSON } from 'is-cson';

// Generate CSON string
const csonString = `
  firstName: 'John'
  lastName: 'Doe'
`;

isCSON(csonString);
// => true
```

### Options

#### `allowJSON`

Default: `false`  

Since CSON is a superset of *well-formatted* JSON, this library runs *strict* tests for CSON only. Enabling this option will also validate JSON, with CSON-specific features (such as trailing commas or single quotes) taking precedence.

<details>
<summary><strong>Example</strong></summary>

```js
const jsonString = `{
  "firstName": "John",
  "lastName": "Doe"
}`;

isCSON(jsonString, { allowJSON: true });
// => true
```
</details>

## License

This work is licensed under [The MIT License](https://opensource.org/licenses/MIT)
