const logger = require('fancy-log')
const chalk = require('chalk')
const { join } = require('path')
const { updateVersions } = require('./updateVersions')
const { writePackage } = require('./writePackage')
const { getDependencies } = require('./getDependencies')
const { findPackages } = require('./findPackages')

exports.syncDependencies = async ({ rootDir, packagesDir = 'packages', silent = false, ignoreSyncDependencies = [] }) => {
  const packages = await findPackages({
    cwd: join(rootDir, packagesDir)
  })

  const dependencies = await getDependencies(join(rootDir, 'package.json'))

  ignoreSyncDependencies.map((pkg) => {
    dependencies.delete(pkg)
  })

  const promises = packages.map(async ({ path, name, pkg }) => {
    !silent && logger('Update package.json', chalk.cyan(pkg.name))

    pkg.dependencies = updateVersions(pkg.dependencies, dependencies, { silent })
    pkg.devDependencies = updateVersions(pkg.devDependencies, dependencies, { silent })
    pkg.peerDependencies = updateVersions(pkg.peerDependencies, dependencies, { char: '^', silent })

    return writePackage(path, pkg)
  })

  await Promise.all(promises)
}
