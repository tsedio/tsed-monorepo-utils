<div style="text-align: center;" align="center">
 <a href="https://tsed.io" target="_blank"><img src="https://tsed.io/tsed-og.png" width="200" alt="Ts.ED logo"/></a><br />
</div>
<h2 class="text-align: center;" align="center">MonoRepo Utils</h2>

> A tool to build and publish packages (TypeScript or JavaSript) on NPM registry (or any other compliant registry) for all projects based on 
mono repository [lerna](https://lerna.js.org/).

## Features

- Publishing packages on NPM, Github packages or any NPM private registries.
- Publishing Docker Image on Docker HUB.
- Deploy Docker Image on heroku.
- Apply Tags and create release note on Github (with semantic-release)
- Publish documentation on Github Pages.
- Update projects example from external repository.

## Workspaces

MonoRepoUtils use Lerna to manage scripts between package. By default, MonoRepoUtils use Yarn as workspaces manager.
You can try with NPM 7. But isn't officially supported right know.

## Supported CI

- GithubActions,
- Travis CI, 
- Circle CI,
- GitLab

## Installation

Run:
```bash
npm install --save-dev @tsed/monorepo-utils
```

## Configuration

MonoRepoUtils support [semantic-release] versioning tools and publishing Release note on Github. By the way, it's not mandatory. You can manage manage versioning 
by you own way.

### Prerequisite configuration

Add the following configuration to your ``package.json:

```json
{
  "scripts": {
     "configure": "monorepo ci configure",
     "build": "monorepo build"
  }, 
  "monorepo": {
    "productionBranch": "main",
    "developBranch": "main",
    "npmAccess": "public"
  }
}
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
    "heroku:publish": ""
  }
}
```

### Configuration with Semantic-release

Install [semantic-release](https://github.com/semantic-release/semantic-release) and add `repo.config.js` file and add these lines:

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

```json
{
  "scripts": {
    "release": "semantic-release"
  }
}
```

### CI Configuration

To deploy with your favority CI, you have to create these environments variables
to allow publishing on your NPM registries,  

commit push and docker image deployment. 

Variable | Description
---|---
EMAIL | User mail to sign the commit produced by MonoRepo
USER | User name to sign the commit produced by MonoRepo
PROJECT_NAME | The project to publish artifact on docker
GH_TOKEN | A GitHub [personal access token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line).
DOCKER_HUB_ID | The docker hub id
DOCKER_HUB_PWD | The docker password account
HEROKU_APP | Enable deployment on heroku. Note: You have to configure HEROKU_API_KEY token on your CI

### Github actions example

```yaml
name: Build & Release
on:
  push:
  pull_request:
    branches:
      - main
jobs:     
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [ 14.x ]

    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v1
        with:
          node-version: ${{ matrix.node-version }}
      - name: Install dependencies
        run: yarn install --frozen-lockfile --network-timeout 500000
      - name: Run build
        run: yarn build
        
# DEPLOY PACKAGES on NPM
deploy-packages:
    runs-on: ubuntu-latest
    needs: [build] # add depend job here
    if: ${{ github.event_name != 'pull_request' && contains(github.ref, 'main') }}

    strategy:
      matrix:
        node-version: [ 14.x ]

    steps:
      - uses: actions/checkout@v2
      - uses: actions/download-artifact@v2
        with:
          name: benchmarks
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v1
        with:
          node-version: ${{ matrix.node-version }}
      - name: Install dependencies
        run: yarn install --frozen-lockfile --network-timeout 500000
      - name: Release packages
        env:
          CI: true
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: yarn release
```
