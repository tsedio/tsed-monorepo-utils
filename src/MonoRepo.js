const { publishPackages } = require('./publishPackages')
const { join } = require('path')
const { build } = require('./build')
const { readPackage } = require('./readPackage')
const { findPackages } = require('./findPackages')

export class MonoRepo {
  constructor ({ rootDir = process.cwd(), packagesDir = 'packages', outputDir = 'dist', silent = false }) {
    this.rootDir = rootDir
    this.packagesDir = packagesDir
    this.outputDir = outputDir
    this.silent = silent
    this.cmdBuild = 'build'
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

  publish (options = {}) {
    return publishPackages({
      ...this,
      ...options,
      rootDir: join(this.rootDir, this.outputDir)
    })
  }
}

exports.MonoRepo = MonoRepo
