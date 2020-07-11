import get from 'lodash/get'
import hasYarn from 'has-yarn'
import logger from 'fancy-log'
import { join } from 'path'
import { npm, yarn } from './utils/cli'
import { getDependencies } from './utils/depencencies/getDependencies'
import { clean } from './utils/common/clean'
import { compilePackages } from './utils/packages/compilePackages'
import { writePackages } from './utils/packages/writePackages'
import { copyPackages } from './utils/packages/copyPackages'
import { syncDependencies } from './utils/depencencies/syncDependencies'
import { publishPackages } from './utils/packages/publishPackages'
import { readPackage } from './utils/packages/readPackage'
import { findPackages } from './utils/packages/findPackages'
import { getEnv } from './utils/env/getEnv'
import { configureWorkspace } from './utils/workspaces/configureWorkspace'
import { commitChanges } from './utils/workspaces/commitChanges'
import { build } from './tasks/build'
import { syncRepository } from './utils/workspaces/syncRepository'
import { createTasksRunner } from './utils/common/createTasksRunner'
import { newVersion } from './utils/packages/newVersion'
import { publishGhPages } from './utils/ghpages/publishGhPages'
import { syncExamplesDependencies } from './utils/examples/syncExamplesDependencies'
import { publishExamples } from './utils/examples/publishExamples'
import { defaultPackageMapper } from './utils/packages/defaultPackageMapper'

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

    this.packagesDir = options.packagesDir || get(this.rootPkg, 'monorepo.packageDir', './packages')
    this.outputDir = options.outputDir || get(this.rootPkg, 'monorepo.outputDir', './dist')
    this.npmAccess = options.npmAccess || get(this.rootPkg, 'monorepo.npmAccess', 'public')
    this.productionBranch = this.env.PRODUCTION_BRANCH || options.productionBranch || get(this.rootPkg, 'monorepo.productionBranch', 'master')
    this.developBranch = this.env.DEVELOP_BRANCH || options.developBranch || get(this.rootPkg, 'monorepo.developBranch', 'master')
    this.origin = this.env.ORIGIN || options.origin || get(this.rootPkg, 'monorepo.origin', 'origin')
    this.registry = this.env.REGISTRY_URL || options.registry || get(this.rootPkg, 'publishConfig.registry', 'https://registry.npmjs.org/')
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
    this.docDir = options.docDir || get(this.rootPkg, 'monorepo.doc.dir', './docs/.vuepress/dist')
    this.docUrl = options.docDir || get(this.rootPkg, 'monorepo.doc.url', this.repositoryUrl)
    this.docBranch = options.docBranch || get(this.rootPkg, 'monorepo.doc.branch', 'gh-pages')
    this.docCname = options.docCname || get(this.rootPkg, 'monorepo.doc.cname', '')

    // EXAMPLES
    this.examplesDir = options.examplesDir || get(this.rootPkg, 'monorepo.examples.dir', './examples')
    this.examplesRepositories = options.examplesRepositories || get(this.rootPkg, 'monorepo.examples.repositories', {})

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
      ...options,
      rootDir: join(this.rootDir, this.outputDir)
    })
  }

  async syncRepository (options = {}) {
    return syncRepository({
      ...this,
      ...options
    })
  }

  async publishGhPages (options = {}) {
    return publishGhPages({
      ...this,
      ...options
    })
  }

  async syncExamplesDependencies(options= {}){
    return syncExamplesDependencies({
      ...this,
      ...options
    })
  }

  async publishExamples(options= {}){
    return publishExamples({
      ...this,
      ...options
    })
  }
}
