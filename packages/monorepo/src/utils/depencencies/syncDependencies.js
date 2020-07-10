import chalk from 'chalk'
import { join } from 'path'
import { updateVersions } from '../packages/updateVersions'
import { writePackage } from '../packages/writePackage'
import { getDependencies } from './getDependencies'
import { findPackages } from '../packages/findPackages'

export async function syncDependencies (context) {
  const { logger, rootDir, packagesDir = 'packages', silent = false, ignoreSyncDependencies = [] } = context
  const packages = await findPackages({
    cwd: join(rootDir, packagesDir)
  })

  const dependencies = await getDependencies(join(rootDir, 'package.json'))

  ignoreSyncDependencies.map((pkg) => {
    dependencies.delete(pkg)
  })

  const promises = packages.map(async ({ path, pkg }) => {
    !silent && logger.info('Update package.json', chalk.cyan(pkg.name))

    pkg.dependencies = updateVersions(pkg.dependencies, dependencies, { silent, logger })
    pkg.devDependencies = updateVersions(pkg.devDependencies, dependencies, { silent, logger })
    pkg.peerDependencies = updateVersions(pkg.peerDependencies, dependencies, { char: '^', silent, logger })

    return writePackage(path, pkg)
  })

  await Promise.all(promises)
}
