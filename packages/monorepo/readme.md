# @tsed/monorepo-utils

<p style="text-align: center" align="center">
  <a href="https://tsed.dev" target="_blank"><img src="https://tsed.dev/tsed-og.png" width="200" alt="Ts.ED logo" /></a>
</p>

[![Build & Release](https://github.com/tsedio/tsed-monorepo-utils/workflows/Build%20%26%20Release/badge.svg?branch=master)](https://github.com/tsedio/tsed-monorepo-utils/actions?query=workflow%3A%22Build+%26+Release%22)
[![TypeScript](https://badges.frapsoft.com/typescript/love/typescript.svg?v=100)](https://github.com/ellerbrock/typescript-badges/)
[![npm version](https://badge.fury.io/js/%40tsed%2Fmonorepo-utils.svg)](https://www.npmjs.com/package/@tsed/monorepo-utils)
[![Known Vulnerabilities](https://snyk.io/test/github/tsedio/tsed-monorepo-utils/badge.svg)](https://snyk.io/test/github/tsedio/tsed-monorepo-utils)

> A CLI and semantic-release plugin for maintaining a JavaScript or TypeScript monorepo: build packages, keep their metadata aligned, manage versions, and publish releases to npm and other targets.

## Goals

`@tsed/monorepo-utils` centralises the recurring tasks needed to maintain a package monorepo: builds, version updates, dependency synchronisation, publishing and release automation.

## Features

- Build workspace packages, including hybrid ESM/CJS packages.
- Keep workspace dependencies and repository metadata in sync.
- Version and publish packages, examples, Docker images, Heroku applications and GitHub Pages.
- Integrate with semantic-release.
- Publish to npm from GitHub Actions with npm trusted publishing and OIDC.

## Installation

```bash
npm install --save-dev @tsed/monorepo-utils
```

## Getting started

Run commands from the monorepo root. The following scripts cover the usual package workflow:

```json
{
  "scripts": {
    "version:patch": "monorepo version patch",
    "version:minor": "monorepo version minor",
    "version:major": "monorepo version major",
    "build": "monorepo build",
    "publish": "monorepo publish packages",
    "docs:build": "vuepress build",
    "docs:publish": "yarn docs:build && monorepo publish ghpages"
  },
  "monorepo": {
    "npmAccess": "public",
    "ghpages": [
      {
        "dir": "./docs/.vuepress/dist",
        "url": "https://github.com/tsedio/tsed.git",
        "branch": "gh-pages",
        "cname": "tsed.io",
        "if": "main"
      }
    ]
  }
}
```

## Commands

All commands accept `--verbose` to enable detailed logging.

### Build packages

```bash
monorepo build
```

Builds all configured workspace packages. To build a hybrid ESM/CJS package, run the command from that package directory:

```bash
monorepo build-hybrid
```

### Clean artifacts

```bash
monorepo clean workspace
monorepo clean docker
```

`workspace` removes generated workspace artifacts. `docker` cleans Docker image tags through the configured Docker integration.

### Version packages

```bash
monorepo version patch
monorepo version minor
monorepo version major
monorepo version 2.0.0
```

Updates the root and workspace package versions, then refreshes the package-manager installation.

### Synchronise the monorepo

```bash
monorepo sync packages
monorepo sync repository
monorepo sync examples
```

Synchronises workspace dependencies, repository metadata, or example dependencies from the root configuration.

### Publish artifacts

```bash
monorepo publish packages
monorepo publish examples
monorepo publish ghpages
monorepo publish docker
monorepo publish heroku
```

Use `--dry-run` with `packages`, `docker`, `heroku`, `examples` or `ghpages` to inspect a publication without making changes:

```bash
monorepo publish packages --dry-run
```

### Configure CI

```bash
monorepo ci configure
```

Configures the workspace for the CI environment.

## Semantic-release

The package integrates with [semantic-release](https://semantic-release.gitbook.io/semantic-release/). Install its plugins, then create `repo.config.js`:

```javascript
export default {
  branches: ["main"],
  verifyConditions: ["@semantic-release/github", "@semantic-release/npm", "@tsed/monorepo-utils/semantic-release"],
  analyzeCommits: ["@semantic-release/commit-analyzer"],
  generateNotes: ["@semantic-release/release-notes-generator"],
  prepare: ["@semantic-release/npm", "@tsed/monorepo-utils/semantic-release"],
  publish: ["@tsed/monorepo-utils/semantic-release", "@semantic-release/github"],
  success: ["@semantic-release/github", "@tsed/monorepo-utils/semantic-release"],
  fail: ["@semantic-release/github"],
  npmPublish: false
};
```

Add the release scripts:

```json
{
  "scripts": {
    "build": "monorepo build",
    "release": "semantic-release"
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

The GitHub Actions release job must use a GitHub-hosted runner, Node 24 (npm 11.5.1 or later), and grant the OIDC permission:

```yaml
release:
  runs-on: ubuntu-latest
  permissions:
    contents: write
    id-token: write
```

On npmjs.com, configure a trusted publisher for every published package. Select GitHub Actions and use the repository plus the workflow filename that performs the release.

### Trusted publication lifecycle

```text
                         Public workspace package
                                   |
                    +--------------+--------------+
                    |                             |
             Already on npm?                      No
                    |                             |
                   Yes                            v
                    |                NPM_TOKEN=... monorepo trust bootstrap
                    v                             |
       monorepo packages status                   | publishes temporary 0.0.1
                    |                             | then configures npm trust github
                    v                             v
     Trusted publisher configured?          Package exists and is trusted
                    |
          +---------+---------+
          |                   |
         Yes                  No
          |                   |
          |        npm login && monorepo trust migrate
          |                   |
          |                   | configures npm trust github
          |                   v
          +---------> Trusted package <-----------+
                                |
                                v
             GitHub Actions release (id-token: write, Node 24)
                                |
                                v
                  semantic-release publishes to npm with OIDC
```

`monorepo trust verify` can be used in CI to fail early when a public package has not yet been bootstrapped.

### Inspect package status

```bash
monorepo packages status
```

The command renders a terminal table with one of these states:

| Status                    | Meaning                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `private`                 | The workspace package is private.                                                              |
| `unpublished`             | The package does not yet exist on npm.                                                         |
| `untrusted`               | The package exists on npm but has no trusted publisher.                                        |
| `trusted`                 | The package has a trusted publisher.                                                           |
| `authentication-required` | npm requires an interactive login or 2FA challenge before it can read the trust configuration. |

The command is interactive when npm requires 2FA: complete the URL shown by npm, then continue in the terminal.

### Migrate existing packages

Authenticate to npm locally, then run:

```bash
npm login
monorepo trust migrate
```

The command asks which workflow from `.github/workflows/` is authorised to publish. It processes packages sequentially, waits for each npm 2FA interaction, configures `npm trust github` only where no trusted publisher exists, and never republishes packages.

Pass `--file build.yml` to select a workflow without the prompt. Use `--repository owner/repository` to override the repository detected from `package.json`. Packages that already have a trusted publisher are skipped rather than overwritten.

### Bootstrap new packages

npm requires a package to exist before a trusted publisher can be configured. Bootstrap new public workspace packages locally with an npm token:

```bash
NPM_TOKEN=... monorepo trust bootstrap
```

The command asks for the GitHub Actions workflow, publishes each unpublished package sequentially with the temporary version `0.0.1`, completes the interactive `npm trust github` setup, then restores the generated package manifest. The next CI release can publish the normal semantic-release version with OIDC.

As with `migrate`, pass `--file build.yml` or `--repository owner/repository` to avoid the workflow prompt or override the detected repository.

When `trustedPublishing` is enabled, semantic-release blocks the CI release if it detects an unpublished public workspace package. Run the bootstrap command locally before retrying the release.

### Verify package publication

```bash
monorepo trust verify
```

Checks that every public workspace package already exists on npm. It is useful in CI before an OIDC release and reports the packages that must first be bootstrapped.

## Contributors

Please read the [contributing guidelines](https://tsed.dev/CONTRIBUTING.html).

<a href="https://github.com/tsedio/tsed-monorepo-utils/graphs/contributors"><img src="https://opencollective.com/tsed/contributors.svg?width=890" alt="Contributors" /></a>

## Backers

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/tsed#backer)]

<a href="https://opencollective.com/tsed#backers" target="_blank"><img src="https://opencollective.com/tsed/tiers/backer.svg?width=890" alt="Backers" /></a>

## Sponsors

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/tsed#sponsor)]

## License

The MIT License (MIT)

Copyright (c) 2016 - Today Romain Lenzotti
