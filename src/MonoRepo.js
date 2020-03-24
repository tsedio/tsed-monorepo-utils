const chalk = require('chalk')
const logger = require('fancy-log')
const { getDependencies } = require('./getDependencies')
const { clean } = require('./clean')
const { compilePackages } = require('./compilePackages')
const { writePackages } = require('./writePackages')
const { copyPackages } = require('./copyPackage')
const { syncDependencies } = require('./syncDependencies')
const { publishPackages } = require('./publishPackages')
const { join } = require('path')
const { readPackage } = require('./readPackage')
const { findPackages } = require('./findPackages')

class MonoRepo {
  constructor (options) {
    const {
      rootDir = process.cwd(),
      packagesDir = 'packages',
      outputDir = 'dist',
      silent = false,
      npmAccess,
      ignoreSyncDependencies = [],
      registry = 'https://registry.npmjs.org/',
      pkgMapper = f => f
    } = options

    this.rootDir = rootDir
    this.packagesDir = packagesDir
    this.outputDir = outputDir
    this.silent = silent
    this.cmdBuild = 'build'
    this.npmAccess = npmAccess
    this.registry = registry
    this.ignoreSyncDependencies = ignoreSyncDependencies
    this.pkgMapper = pkgMapper
  }

  async getPackages () {
    return findPackages({
      cwd: join(this.rootDir, this.packagesDir)
    })
  }

  async getDependencies () {
    return getDependencies(join(this.rootDir, 'package.json'))
  }

  async getRootPackage () {
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
    const { silent } = this

    !silent && logger(`Starting '${chalk.cyan('monorepo:clean')}'...`)

    await this.clean(options)

    !silent && logger(`Finished '${chalk.cyan('monorepo:clean')}'`)
    !silent && logger(`Starting '${chalk.cyan('monorepo:compilePackages')}'...`)

    await this.compilePackages(options)

    !silent && logger(`Finished '${chalk.cyan('monorepo:compilePackages')}'`)
    !silent && logger(`Starting '${chalk.cyan('monorepo:syncDependencies')}'...`)

    await this.syncDependencies(options)

    !silent && logger(`Finished '${chalk.cyan('monorepo:syncDependencies')}'...`)
    !silent && logger(`Starting '${chalk.cyan('monorepo:copyPackages')}'...`)

    await this.copyPackages()

    !silent && logger(`Finished '${chalk.cyan('monorepo:copyPackages')}'`)
    !silent && logger(`Starting '${chalk.cyan('monorepo:writePackages')}'...`)

    await this.writePackages(options)

    !silent && logger(`Finished '${chalk.cyan('monorepo:writePackages')}'`)
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

  async publish (options = {}) {
    return publishPackages({
      ...this,
      ...options,
      rootDir: join(this.rootDir, this.outputDir)
    })
  }
}

exports.MonoRepo = MonoRepo
