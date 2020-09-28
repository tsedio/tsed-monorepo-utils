import chalk from 'chalk'
import { existsSync } from 'fs'
import { join } from 'path'
import { getDependencies } from '../depencencies/getDependencies'
import { findPackages } from '../packages/findPackages'
import { readPackage } from '../packages/readPackage'
import { updateVersions } from '../packages/updateVersions'
import { writePackage } from '../packages/writePackage'
import { findExamples } from './findExamples'

async function resolveDependencies (context) {
  const { rootDir, packagesDir = 'packages' } = context
  const dependenciesMap = await getDependencies(join(rootDir, 'package.json'))

  const packages = await findPackages({ cwd: join(rootDir, packagesDir) })

  packages.forEach(({ pkg: { name, version, devDependencies, dependencies } }) => {
    dependenciesMap.set(name, version)

    Object.entries({
      ...dependencies,
      ...devDependencies
    }).forEach(([key, value]) => {
      dependenciesMap.set(key, value.replace(/^\^/, ''))
    })
  })

  return dependenciesMap
}

async function updatePackage (pkgPath, context) {
  const { logger, rootDir, silent = false } = context

  const currentPkg = await readPackage(pkgPath)
  const dependencies = await resolveDependencies(context)

  !silent && logger('Update package', chalk.cyan(pkgPath))

  currentPkg.dependencies = updateVersions(currentPkg.dependencies, dependencies, context)
  currentPkg.devDependencies = updateVersions(currentPkg.devDependencies, dependencies, context)

  await writePackage(pkgPath, currentPkg)
}

export async function syncExampleDependencies (project, context) {
  const cwd = join(context.examples.dir, project)
  const pkgPath = join(cwd, '/package.json')

  await updatePackage(pkgPath, context)

  const lernaProjectPath = join(cwd, 'packages')

  if (existsSync(lernaProjectPath)) {
    await updatePackage(join(lernaProjectPath, 'server', 'package.json'), context)
  }
}

export async function syncExamplesDependencies (context) {
  return Promise.all(findExamples(context).map((project) => syncExampleDependencies(project, context)))
}
