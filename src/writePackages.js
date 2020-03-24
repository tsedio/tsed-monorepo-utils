const { join } = require('path')
const chalk = require('chalk')
const logger = require('fancy-log')
const { writePackage } = require('./writePackage')
const { findPackages } = require('./findPackages')
const { readPackage } = require('./readPackage')

const noop = p => p

exports.writePackages = async ({ rootDir, packagesDir, outputDir, silent = false, ignore = [], pkgMapper = noop }) => {
  const rootPkg = await readPackage(join(rootDir, 'package.json'))

  const pkgs = await findPackages({
    cwd: join(rootDir, packagesDir)
  })

  const promises = pkgs.map(async ({ name, pkg }) => {
    !silent && logger('Write package.json', chalk.cyan(pkg.name))

    pkg = pkgMapper(pkg, { name, rootPkg })

    return writePackage(join(outputDir, name, 'package.json'), pkg)
  })

  return Promise.all(promises)
}
