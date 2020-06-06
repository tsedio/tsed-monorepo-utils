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
    "build": "monorepo build", // build packages
    "test:e2e: "",
    "publish": "monorepo publish" // publish on NPM
  }
}
```

### Configuration with Semantic-release

MonoRepoUtils is also compatible with semantic-release.

Install semantic-release and add repo.config.js file and add these lines:

```javascript
module.exports = {
  branch: 'master',
  verifyConditions: ['@semantic-release/github', '@semantic-release/npm', '@tsed/monorepo-utils/semantic-release'],
  analyzeCommits: ['@semantic-release/commit-analyzer'],
  verifyRelease: [],
  generateNotes: ['@semantic-release/release-notes-generator'],
  prepare: ['@semantic-release/npm', '@tsed/monorepo-utils/semantic-release'],
  publish: ['@tsed/monorepo-utils/semantic-release', '@semantic-release/github'],
  success: ['@semantic-release/github', '@tsed/monorepo-utils/semantic-release'],
  fail: ['@semantic-release/github'],
  npmPublish: false
}
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
