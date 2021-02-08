# @tsed/yarn-workspaces

An util inspired
by [react-workspaces](https://github.com/react-workspaces/create-react-app/blob/master/packages/react-scripts/config/yarn-workspaces.js)
. This package, allow you to configure a [CRACO](https://github.com/gsoft-inc/craco) project and
use [yarn](https://classic.yarnpkg.com/en/docs/workspaces/) workspaces to create shared modules in the same mono
repository.

## Prerequisite

- A project configured with Yarn workspaces,
- CRACO

## Installation

Install the `@tsed/yarn-workspaces` on the react project level generated with CRACO:

```bash
yarn add -D @tsed/yarn-workspaces
```

Then edit or add the `craco.config.js`:

```js
const { configure, ensureReact } = require("@tsed/yarn-workspaces")

module.exports = {
  webpack: {
    configure: (webpackConfig, ctx) => {
      webpackConfig = ensureReact(configure(webpackConfig, ctx))
      // other things ...
      return webpackConfig
    }
  }
}
```
> `ensureReact` function ensure that webpack only one version of react.

Now you can create a `shared` package in your `packages` directory. for example create a `shared` directory and add a
new package.json:

```json
{
  "name": "@project/shared",
  "version": "1.0.0",
  "main": "src/index.js",
  "main:src": "src/index.js"
}
```

> Note: The `main:src` must be provided to tell yarnWorkspaces that the package exports some codes.

Then, in the application `package.json` add the `@project/shared` as dependencies:

```json
{
  "name": "@project/app",
  "version": "1.0.0",
  "main": "src/index.js",
  "dependencies": {
    "@project/shared": "1.0.0"
  }
}
```

Finally, imported a shared component in your App and start the application!