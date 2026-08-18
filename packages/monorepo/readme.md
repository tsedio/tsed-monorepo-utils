# @tsed/monorepo-utils

A tool to build and publish packages (Typescript or Javascript) on npm for projects based on
mono repository (lerna).

## Installation

Run:

```bash
npm install --save-dev @tsed/monorepo-utils
```

### Configuration without Semantic-release

Add these tasks to your package.json:

```
{
  "scripts": {
    "test": "",
    "version:patch": "monorepo version patch", // update version
    "version:minor": "monorepo version minor",
    "version:major": "monorepo version major",
    "build": "monorepo build packages", // build packages
    "test:e2e: "",
    "publish": "monorepo publish packages" // publish on NPM
    "docs:build": "vuepress build",
    "docs:publish": "yarn docs:build && monorepo publish ghpages"
  },
  "monorepo": {
     "ghpages": [{
       "dir": "./docs/.vuepress/dist",
       "url": "https://github.com/tsedio/tsed.git",
       "branch": "gh-pages",
       "cname": "tsed.io",
       "if": "main"
     }]
   }
}
```

## npm trusted publishing (OIDC)

Set `trustedPublishing` in the root `monorepo` configuration to publish from GitHub Actions without a long-lived npm token:

```json
{
  "monorepo": {
    "npmAccess": "public",
    "trustedPublishing": true
  }
}
```

The GitHub Actions job that runs the release must use a GitHub-hosted runner, Node 24 (npm 11.5.1 or later), and grant the OIDC permission:

```yaml
release:
  runs-on: ubuntu-latest
  permissions:
    contents: write
    id-token: write
```

On npmjs.com, configure a trusted publisher for every published package. Select GitHub Actions and use the repository plus the workflow filename that performs the release.

### Inspect package status

Use the following command to inspect every workspace package without changing anything:

```bash
monorepo packages status
```

It renders a terminal table with one of these states:

| Status                    | Meaning                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `private`                 | The workspace package is private.                                                              |
| `unpublished`             | The package does not yet exist on npm.                                                         |
| `untrusted`               | The package exists on npm but has no trusted publisher.                                        |
| `trusted`                 | The package has a trusted publisher.                                                           |
| `authentication-required` | npm requires an interactive login or 2FA challenge before it can read the trust configuration. |

The command is interactive when npm requires 2FA: complete the URL shown by npm, then continue in the terminal.

### Migrate packages already published on npm

Authenticate to npm locally, then run:

```bash
npm login
monorepo trust migrate
```

The command asks which workflow from `.github/workflows/` is authorized to publish. It processes packages sequentially, waits for each npm 2FA interaction, configures `npm trust github` only where no trusted publisher exists, and never republishes packages.

Pass `--file build.yml` to select a workflow without the prompt. A package that already has a trusted publisher is skipped rather than overwritten.

### Bootstrap a new npm package

npm requires a package to exist before a trusted publisher can be configured. Bootstrap new public workspace packages locally with an npm token:

```bash
NPM_TOKEN=... monorepo trust bootstrap
```

The command asks for the GitHub Actions workflow, publishes each unpublished package sequentially with the temporary version `0.0.1`, completes the interactive `npm trust github` setup, then restores the generated package manifest. The next CI release can publish the normal semantic-release version with OIDC.

When `trustedPublishing` is enabled, semantic-release blocks the CI release if it detects an unpublished public workspace package. Run the bootstrap command locally before retrying the release.

### Configuration with Semantic-release

MonoRepoUtils is also compatible with semantic-release.

Install semantic-release and add repo.config.js file and add these lines:

```javascript
module.exports = {
  branch: "main",
  verifyConditions: ["@semantic-release/github", "@semantic-release/npm", "@tsed/monorepo-utils/semantic-release"],
  analyzeCommits: ["@semantic-release/commit-analyzer"],
  verifyRelease: [],
  generateNotes: ["@semantic-release/release-notes-generator"],
  prepare: ["@semantic-release/npm", "@tsed/monorepo-utils/semantic-release"],
  publish: ["@tsed/monorepo-utils/semantic-release", "@semantic-release/github"],
  success: ["@semantic-release/github", "@tsed/monorepo-utils/semantic-release"],
  fail: ["@semantic-release/github"],
  npmPublish: false
};
```

Add these tasks to your package.json:

```
{
  "scripts": {
    "build": "monorepo build", // Will be called automatically semantic-release
    "release": "semantic-release"
  }
}
```
