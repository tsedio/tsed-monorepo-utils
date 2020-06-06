import chalk from 'chalk'
import fs from 'fs-extra'
import { dirname, join } from 'path'
import { npm } from './cli'
import { findPackages } from './findPackages'


function writeNpmrc (path, registry) {
  const npmrc = join(path, '.npmrc')
  registry = registry.replace('https:', '').replace('http:', '')

  fs.writeFileSync(npmrc, registry + ':_authToken=${NPM_TOKEN}', { encoding: 'utf8' })

  return npmrc
}

export async function publishPackages (context) {
  const {
    logger,
    rootDir,
    silent = false,
    npmAccess,
    dryRun = false,
    registry = 'https://registry.npmjs.org/'
  } = context

  const pkgs = await findPackages({
    cwd: rootDir
  })

  pkgs
    .filter(({ pkg }) => !pkg.private)
    .map(({ path, pkg }) => {
      !silent && logger.info('Publish package', chalk.cyan(pkg.name))

      const cwd = dirname(path)

      try {
        const npmrc = writeNpmrc(cwd, registry)

        if (dryRun) {
          npm.pack().sync()
        } else {
          npm.publish('--userconfig', npmrc, '--access', npmAccess, '--registry', registry).sync()
        }

      } catch (er) {
        logger.error(chalk.red(er.message), chalk.red(er.stack))
        process.exit(-1)
      }

      return undefined
    })
}
