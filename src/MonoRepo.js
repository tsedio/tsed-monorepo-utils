const { syncDependencies } = require('./syncDependencies')
const { publishPackages } = require('./publishPackages')
const { join } = require('path')
const { build } = require('./build')
const { readPackage } = require('./readPackage')
const { findPackages } = require('./findPackages')

export class MonoRepo {
  constructor (options) {
    const {
      rootDir = process.cwd(),
      packagesDir = 'packages',
      outputDir = 'dist',
      silent = false,
      npmAccess,
      ignoreSyncDependencies = [],
      registry = 'https://registry.npmjs.org/'
    } = options

    this.rootDir = rootDir
    this.packagesDir = packagesDir
    this.outputDir = outputDir
    this.silent = silent
    this.cmdBuild = 'build'
    this.npmAccess = npmAccess
    this.registry = registry
    this.ignoreSyncDependencies = ignoreSyncDependencies
  }

  async getPackages () {
    return findPackages({
      cwd: join(this.rootDir, this.packagesDir)
    })
  }

  async getRootPackage () {
    return readPackage(join(this.rootDir, 'package.json'))
  }

  build (options) {
    return build({
      ...this,
      ...options
    })
  }

  syncDependencies (options) {
    return syncDependencies({
      ...this,
      ...options
    })
  }

  publish (options = {}) {
    return publishPackages({
      ...this,
      ...options,
      rootDir: join(this.rootDir, this.outputDir)
    })
  }
}

exports.MonoRepo = MonoRepo
