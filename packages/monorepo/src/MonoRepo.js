import get from 'lodash/get'
import { npm, yarn } from './utils/cli'
import logger from 'fancy-log'
import { join } from 'path'
import { getDependencies } from './utils/getDependencies'
import { clean } from './utils/clean'
import { compilePackages } from './utils/compilePackages'
import { writePackages } from './utils/writePackages'
import { copyPackages } from './utils/copyPackages'
import { syncDependencies } from './utils/syncDependencies'
import { publishPackages } from './utils/publishPackages'
import { readPackage } from './utils/readPackage'
import { findPackages } from './utils/findPackages'
import { getEnv } from './utils/getEnv'
import { configureWorkspace } from './utils/configureWorkspace'
import { commitChanges } from './utils/commitChanges'
import { build } from './tasks/build'
import { syncRepository } from './utils/syncRepository'
import { createTasksRunner } from './utils/createTasksRunner'
import { newVersion } from './utils/newVersion'
import hasYarn from 'has-yarn'

export class MonoRepo {
  constructor (options) {
    const {
      rootDir = process.cwd(),
      pkgMapper = f => f,
      verbose
    } = options

    this.rootDir = rootDir
    this.rootPkg = this.getRootPackage()
    this.env = getEnv(this.rootPkg)

    this.packagesDir = options.packagesDir || get(this.rootPkg, 'monorepo.packageDir', './packages')
    this.outputDir = options.outputDir || get(this.rootPkg, 'monorepo.outputDir', './dist')
    this.npmAccess = options.npmAccess || get(this.rootPkg, 'monorepo.npmAccess', 'public')
    this.productBranch = this.env.PRODUCTION_BRANCH || options.productBranch || get(this.rootPkg, 'monorepo.productBranch', 'master')
    this.developBranch = this.env.DEVELOP_BRANCH || options.developBranch || get(this.rootPkg, 'monorepo.developBranch', 'master')
    this.origin = this.env.ORIGIN || options.origin || get(this.rootPkg, 'monorepo.origin', 'origin')
    this.registry = this.env.REGISTRY_URL || options.registry || get(this.rootPkg, 'publishConfig.registry', 'https://registry.npmjs.org/')
    this.repositoryUrl = this.env.REPOSITORY_URL || options.repositoryUrl || get(this.rootPkg, 'repository.url', get(this.rootPkg, 'repository'))
    this.ignoreSyncDependencies = options.ignoreSyncDependencies || get(this.rootPkg, 'monorepo.ignoreSyncDependencies', [])
    this.pkgMapper = options.pkgMapper || (f => f)
    this.pkgMapper = pkgMapper
    this.logger = options.logger || logger
    this.verbose = verbose
    this.hasYarn = hasYarn(this.rootDir)
    this.hasLerna = this.rootPkg.dependencies.lerna || this.rootPkg.devDependencies.lerna
    this.hasBuild = this.rootPkg.scripts.build
    this.hasE2E = this.rootPkg.scripts['test:e2e']
    this.branchName = this.env.BRANCH_NAME

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

  async clean () {
    return clean([
      join(this.rootDir, this.outputDir),
      join(this.rootDir, this.packagesDir, '*', 'lib')
    ])
  }

  async build (options = {}) {
    const context = {
      ...this,
      ...options
    }
    return createTasksRunner(build(context), context)
  }

  async buildWorkspace () {
    if (this.hasBuild) {
      await this.manager.run('build')
    }

    if (this.hasE2E) {
      await this.manager.run('test:e2e')
    }
  }

  async syncDependencies (options = {}) {
    return syncDependencies({
      ...this,
      ...options
    })
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

  async publish (options = {}) {
    return publishPackages({
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
}
