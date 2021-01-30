import chalk from 'chalk'
import fs from 'fs-extra'
import { dirname, join } from 'path'
import { npm } from '../cli'
import { findPackages } from './findPackages'


function writeNpmrc (path, registries) {
  const npmrc = join(path, '.npmrc')

  const content = registries.map((registry) => {
    registry = registry.replace('https:', '').replace('http:', '')

    let token = 'NODE_AUTH_TOKEN'

    if (registry.includes('npmjs')) {
      token = 'NPM_TOKEN'
    }

    if (registry.includes('github')) {
      token = 'GH_TOKEN'
    }

    return registry + ':_authToken=${' + token + '}'
  })

  fs.writeFileSync(npmrc, content.join('\n'), { encoding: 'utf8' })

  return npmrc
}

export async function publishPackages (context) {
  const {
    logger,
    rootDir,
    npmAccess,
    dryRun = false,
    registry = 'https://registry.npmjs.org/',
    registries = []
  } = context

  const pkgs = await findPackages({
    cwd: rootDir
  })

  const promises =pkgs
    .filter(({ pkg }) => !pkg.private)
    .map(async ({ path, pkg }) => {
      logger.info('Publish package', chalk.cyan(pkg.name))

      try {
        const cwd = dirname(path)

        if (dryRun) {
          npm.pack().sync({
            cwd,
            env: {
              NPM_TOKEN: 'test'
            }
          })
        } else {
          const urls = [...new Set(registries.concat(registry).filter(Boolean))]
          const npmrc = writeNpmrc(cwd, urls)

          const promises = urls.map((registry) =>
            npm.publish('--userconfig', npmrc, '--access', npmAccess, '--registry', registry).cwd(cwd)
          )

          await Promise.all(promises)
        }

      } catch (er) {
        logger.error(chalk.red(er.message), chalk.red(er.stack))
        process.exit(-1)
      }

      return undefined
    })

  await Promise.all(promises)
}
