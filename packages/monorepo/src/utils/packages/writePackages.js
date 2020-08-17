import { join } from 'path'
import chalk from 'chalk'
import logger from 'fancy-log'
import { writePackage } from './writePackage'
import { findPackages } from './findPackages'
import { readPackage } from './readPackage'

const noop = p => p

export async function writePackages ({ rootDir, npmDistTag, packagesDir, outputDir, silent = false, ignore = [], pkgMapper = noop }) {
  const rootPkg = readPackage(join(rootDir, 'package.json'))

  const pkgs = await findPackages({
    cwd: join(rootDir, packagesDir)
  })

  const promises = pkgs.map(async ({ name, pkg }) => {
    !silent && logger('Write package.json', chalk.cyan(pkg.name))

    pkg = pkgMapper(pkg, { packagesDir, name, rootPkg })

    if (npmDistTag) {
      pkg.publishConfig = {
        ...(pkg.publishConfig || {}),
        tag: npmDistTag
      }
    }

    if (pkg.main.includes('/src/index.ts')) {
      pkg.main = './lib/index.js'
      pkg.typings = 'lib/index.d.ts'
    }

    return writePackage(join(outputDir, name, 'package.json'), pkg)
  })

  return Promise.all(promises)
}
