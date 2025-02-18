# vite-eslint-plugin
vite eslint插件
# @florenza/vite-eslint-plugin

[![npm](https://img.shields.io/npm/v/vite-plugin-eslint)](https://www.npmjs.com/package/@florenza/vite-eslint-plugin)
![npm peer dependency version](https://img.shields.io/npm/dependency-version/vite-plugin-eslint/peer/vite)
![npm peer dependency version](https://img.shields.io/npm/dependency-version/vite-plugin-eslint/peer/eslint)
[![GitHub license](https://img.shields.io/github/license/Florenza/vite-eslint-plugin)](https://github.com/gxmari007/vite-plugin-eslint/blob/master/LICENSE)

ESLint plugin for vite.

## Install

```bash
npm  i @florenza/vite-eslint-plugin --save-dev
# or
yarn add @florenza/vite-eslint-plugin -D
```

## Usage

```js
import { defineConfig } from 'vite'
import eslint from 'vite-plugin-eslint'

export default defineConfig({
  plugins: [eslint()]
})
```

If you do not want the plugin to break dev, you can configure the plugin this way: 
```js
import { defineConfig } from 'vite';
import eslint from '@florenza/vite-eslint-plugin';

export default defineConfig({
  plugins: [
    { // default settings on build (i.e. fail on error)
      ...eslint(),
      apply: 'build',
    },
    { // do not fail on serve (i.e. local development)
      ...eslint({
        failOnWarning: false,
        failOnError: false,
      }),
      apply: 'serve',
      enforce: 'post'
    }
  ],
});

```

## Options

You can pass [eslint options](https://eslint.org/docs/developer-guide/nodejs-api#-new-eslintoptions).

### `cache`

- Type: `boolean`
- Default: `false`

Decrease execution time, `Beta` Cache now correctly recognizes file changes, you can try it out.

### `fix`

- Type: `boolean`
- Default: `false`

Auto fix source code.

### `eslintPath`

- Type: `string`
- Default: `eslint`

Path to `eslint` instance that will be used for linting.

### `lintOnStart`

- Type: `boolean`
- Default: `false`

Check all matching files on project startup, too slow, turn on discreetly.

### `include`

- Type: `string | string[]`
- Default: `['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx', '**/*.vue', '**/*.svelte']`

A single file, or array of files, to include when linting.

### `exclude`

- Type: `string | string[]`
- Default: `['**/node_modules/**']`

A single file, or array of files, to exclude when linting.

### `formatter`

- Type: `string | ESLint.Formatter['format']`
- Default: `stylish`

Custom error formatter or the name of a built-in formatter.

### `emitWarning`

- Type: `boolean`
- Default: `true`

The warings found will be printed.

### `emitError`

- Type: `boolean`
- Default: `true`

The errors found will be printed.

### `failOnWarning`

- Type: `boolean`
- Default: `false`

Will cause the module build to fail if there are any warnings, based on `emitWarning`.

### `failOnError`

- Type: `boolean`
- Default: `true`

Will cause the module build to fail if there are any errors, based on `emitError`.

## License

MIT
