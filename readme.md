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
    "docs:publish": "yarn docs:build && monorepo publish ghpages",
    "heoru:publish": ""
  },
  "monorepo": {
     "ghpages": {
       "dir": "./docs/.vuepress/dist",
       "url": "https://github.com/tsedio/tsed.git",
       "branch": "gh-pages",
       "cname": "tsed.io"
     }
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

### Configure CI

Monorepo can be used with Travis CI, Circle CI and GitLab. You have to create these environments variables
to allow git release note deployment, commit push and docker image deployment. 

Variable | Description
---|---
EMAIL | User mail to sign the commit produced by MonoRepo
USER | User name to sign the commit produced by MonoRepo
PROJECT_NAME | The project to publish artifact on docker
GH_TOKEN | A GitHub [personal access token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line).
DOCKER_HUB_ID | The docker hub id
DOCKER_HUB_PWD | The docker password account
HEROKU_APP | Enable deployment on heroku. Note: You have to configure HEROKU_API_KEY token on your CI
