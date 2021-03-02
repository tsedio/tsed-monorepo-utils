import chalk from 'chalk'
import get from 'lodash/get'
import hasYarn from 'has-yarn'
import logger from 'fancy-log'
import { join } from 'path'
import { npm, yarn } from './utils/cli'
import { getDependencies } from './utils/depencencies/getDependencies'
import { clean } from './utils/common/clean'
import { syncExamples } from './utils/examples/syncExample'
import { compilePackages } from './utils/packages/compilePackages'
import { writePackages } from './utils/packages/writePackages'
import { copyPackages } from './utils/packages/copyPackages'
import { syncDependencies } from './utils/depencencies/syncDependencies'
import { publishPackages } from './utils/packages/publishPackages'
import { readPackage } from './utils/packages/readPackage'
import { findPackages } from './utils/packages/findPackages'
import { getEnv } from './utils/env/getEnv'
import { configureWorkspace } from './utils/workspace/configureWorkspace'
import { commitChanges } from './utils/workspace/commitChanges'
import { build } from './tasks/build'
import { syncRepository } from './utils/workspace/syncRepository'
import { createTasksRunner } from './utils/common/createTasksRunner'
import { newVersion } from './utils/packages/newVersion'
import { publishGhPages } from './utils/ghpages/publishGhPages'
import { publishExamples } from './utils/examples/publishExamples'
import { defaultPackageMapper } from './utils/packages/defaultPackageMapper'
import { publishDocker } from './utils/docker/publishDocker'
import { publishHeroku } from './utils/heroku/publishHeroku'
import { cleanTagsDocker } from './utils/docker/cleanTagsDocker'

export class MonoRepo {
  constructor (options) {
    const {
      rootDir = process.cwd(),
      pkgMapper = defaultPackageMapper,
      verbose
    } = options

    this.rootDir = rootDir
    this.rootPkg = this.getRootPackage()
    this.env = getEnv(this.rootPkg)
    this.ghToken = options.ghToken || this.env.GH_TOKEN
    this.packagesDir = options.packagesDir || get(this.rootPkg, 'monorepo.packageDir', './packages')
    this.version = options.version || this.rootPkg.version
    this.outputDir = options.outputDir || get(this.rootPkg, 'monorepo.outputDir', './dist')
    this.npmAccess = options.npmAccess || get(this.rootPkg, 'monorepo.npmAccess', 'public')
    this.npmDistTag = options.npmDistTag || get(this.rootPkg, 'monorepo.npmDistTag', get(this.rootPkg, 'publishConfig.tag'))
    this.skipNpmPublish = options.skipNpmPublish || get(this.rootPkg, 'monorepo.skipNpmPublish', false)
    this.productionBranch = this.env.PRODUCTION_BRANCH || options.productionBranch || get(this.rootPkg, 'monorepo.productionBranch', 'master')
    this.developBranch = this.env.DEVELOP_BRANCH || options.developBranch || get(this.rootPkg, 'monorepo.developBranch', 'master')
    this.origin = this.env.ORIGIN || options.origin || get(this.rootPkg, 'monorepo.origin', 'origin')
    this.registry = this.env.REGISTRY_URL || options.registry || get(this.rootPkg, 'publishConfig.registry', 'https://registry.npmjs.org/')
    this.registries = options.registries || get(this.rootPkg, 'monorepo.registries', [])
    this.repositoryUrl = this.env.REPOSITORY_URL || options.repositoryUrl || get(this.rootPkg, 'repository.url', get(this.rootPkg, 'repository'))
    this.ignoreSyncDependencies = options.ignoreSyncDependencies || get(this.rootPkg, 'monorepo.ignoreSyncDependencies', [])
    this.pkgMapper = pkgMapper
    this.logger = options.logger || logger
    this.verbose = verbose
    this.hasYarn = hasYarn(this.rootDir)
    this.hasLerna = this.rootPkg.dependencies.lerna || this.rootPkg.devDependencies.lerna
    this.hasBuild = this.rootPkg.scripts.build
    this.hasE2E = this.rootPkg.scripts['test:e2e']
    this.branchName = this.env.BRANCH_NAME

    // DOC
    this.ghpages = {
      dir: options.ghpagesDir || get(this.rootPkg, 'monorepo.ghpages.dir', ''),
      url: options.ghpagesUrl || get(this.rootPkg, 'monorepo.ghpages.url', this.repositoryUrl),
      branch: options.ghpagesBranch || get(this.rootPkg, 'monorepo.ghpages.branch', 'gh-pages'),
      cname: options.ghpagesCname || get(this.rootPkg, 'monorepo.ghpages.cname', '')
    }

    // EXAMPLES
    this.examples = {
      dir: options.examplesDir || get(this.rootPkg, 'monorepo.examples.dir', './examples'),
      repositories: options.examplesRepositories || get(this.rootPkg, 'monorepo.examples.repositories', {})
    }

    // HEROKU
    this.heroku = {
      app: options.herokuApp || this.env.HEROKU_APP || get(this.rootPkg, 'monorepo.heroku.app', ''),
      apiKey: options.herokuApiKey || this.env.HEROKU_API_KEY || get(this.rootPkg, 'monorepo.heroku.apiKey', '')
    }

    // DOCKER
    this.dockerhub = {
      repository: options.dockerhubRepository || this.env.DOCKER_REPOSITORY || get(this.rootPkg, 'monorepo.dockerhub.repository', ''),
      id: options.dockerhubId || this.env.DOCKER_HUB_ID || get(this.rootPkg, 'monorepo.dockerhub.id', ''),
      pwd: options.dockerhubPwd || this.env.DOCKER_HUB_PWD || get(this.rootPkg, 'monorepo.dockerhub.pwd', '')
    }

    this.manager = this.hasYarn ? yarn : npm
  }

  async getPackages () {
    return findPackages({
      cwd: join(this.rootDir, this.packagesDir)
    })
  }

  getDependencies () {
    return getDependencies(join(this.rootDir, 'package.json'))
  }

  getRootPackage () {
    return readPackage(join(this.rootDir, 'package.json'))
  }

  async copyPackages (options = {}) {
    return copyPackages({
      ...this,
      ...options
    })
  }

  async clean (type, options = {}) {
    switch (type) {
      case 'workspace':
        return clean([
          join(this.rootDir, this.outputDir),
          join(this.rootDir, this.packagesDir, '*', 'lib'),
          join(this.rootDir, this.packagesDir, '*', 'dist'),
          'test/**/*.{js,js.map,d.ts}',
          'test/**/*.{js,js.map,d.ts}',
          join(this.rootDir, this.packagesDir, '**', '*.{js,js.map,d.ts,d.ts.map}'),
          join(this.rootDir, this.packagesDir, '**', '*.{js,js.map,d.ts,d.ts.map}')
        ])
      case 'docker':
        return cleanTagsDocker({
          ...this,
          ...options
        })
    }
    throw new Error(`Unsupported clean type: ${type}. Supported types: workspace, docker`)
  }

  async build (type, options = {}) {
    const context = {
      ...this,
      ...options
    }

    switch (type) {
      case 'workspace':
        return this.buildWorkspace()
      case 'packages':
      default:
        return createTasksRunner(build(context), context)
    }
  }

  async buildWorkspace () {
    if (this.hasBuild) {
      await this.manager.run('build')
    }

    if (this.hasE2E) {
      await this.manager.run('test:e2e')
    }
  }

  async writePackages (options = {}) {
    return writePackages({
      ...this,
      ...options
    })
  }

  async compilePackages (options = {}) {
    return compilePackages({
      ...this,
      ...options
    })
  }

  async configureWorkspace (options = {}) {
    return configureWorkspace({
      ...this,
      ...options
    })
  }

  async newVersion (options) {
    return newVersion({
      ...this,
      ...options
    })
  }

  async commitChanges (options) {
    return commitChanges({
      ...this,
      ...options
    })
  }

  async sync (type, options = {}) {
    switch (type) {
      case 'repository':
        return this.syncRepository(options)
      case 'examples':
        return this.syncExamples(options)
      case 'packages':
        return this.syncDependencies(options)
    }
    throw new Error(`Unsupported clean type: ${type}. Supported types: repository, examples, packages`)
  }

  async syncDependencies (options = {}) {
    return syncDependencies({
      ...this,
      ...options
    })
  }

  async syncRepository (options = {}) {
    return syncRepository({
      ...this,
      ...options
    })
  }

  async syncExamples (options = {}) {
    return syncExamples({
      ...this,
      ...options
    })
  }

  publish (type, options = {}) {
    switch (type) {
      case 'packages':
        return this.publishPackages(options)
      case 'ghpages':
        return this.publishGhPages(options)
      case 'heroku':
        return this.publishHeroku(options)
      case 'docker':
        return this.publishDocker(options)
      case 'examples':
        return this.publishExamples(options)
    }

    throw new Error(`Unsupported publish type: ${type}. Supported types: packages, ghpages, heroku, docker, examples`)
  }

  async publishPackages (options = {}) {
    if (this.skipNpmPublish) {
      this.logger.info('Publish packages skipped... (See skipNpmPublish option)')
      return
    }
    return publishPackages({
      ...this,
      ...options,
      rootDir: join(this.rootDir, this.outputDir)
    })
  }

  async publishGhPages (options = {}) {
    return publishGhPages({
      ...this,
      ...options
    })
  }

  async publishExamples (options = {}) {
    return publishExamples({
      ...this,
      ...options
    })
  }

  async publishDocker (options = {}) {
    return publishDocker({
      ...this,
      ...options
    })
  }

  async publishHeroku (options = {}) {
    return publishHeroku({
      ...this,
      ...options
    })
  }
}
