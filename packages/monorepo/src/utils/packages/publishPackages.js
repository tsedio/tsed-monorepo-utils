import chalk from 'chalk'
import fs from 'fs-extra'
import {dirname, join} from 'path'
import {npm} from '../cli'
import {findPackages} from './findPackages'

function writeNpmrc(path, registries, scope) {
  const npmrc = join(path, '.npmrc')

  const content = registries.map((registry) => {
    registry = registry.replace('https:', '').replace('http:', '')

    let token = 'NODE_AUTH_TOKEN'

    if (registry.includes('github')) {
      return scope + ':registry=https:' + registry + '\n' +
        registry + '/:_authToken=${GH_TOKEN}\n'
    }

    if (registry.includes('npmjs')) {
      token = 'NPM_TOKEN'
    }


    return registry + ':_authToken=${' + token + '}'
  })

  fs.writeFileSync(npmrc, content.join('\n'), {encoding: 'utf8'})

  return npmrc
}

export async function publishPackages(context) {
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

  const urls = [...new Set(registries.concat(registry).filter(Boolean))]
  const errors = []
  const promises = pkgs
    .filter(({pkg}) => !pkg.private)
    .map(async ({path, pkg}) => {
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
          for (const url in urls) {
            const npmrc = writeNpmrc(cwd, [url], pkg.name.split('/')[0])
            try {
              logger.info("Publish package",  chalk.cyan(pkg.name),  "on", url)
              await npm.publish('--userconfig', npmrc, '--access', npmAccess, '--registry', registry).cwd(cwd)
            } catch (er) {
              errors.push({pkg, error: er, registry})
              logger.error(chalk.red(er.message), chalk.red(er.stack))
            }
          }
        }
      } catch (er) {
        logger.error(chalk.red(er.message), chalk.red(er.stack))
        errors.push({pkg, error: er})
      }

      return undefined
    })

  if (errors.length) {
    logger.error(chalk.red('Some packages have not been published: \n' + errors.map(({pkg, error, registry}) => {
      return [pkg.name, registry, error.message].filter(Boolean).join(' - ')
    }).join('\n')))
  }

  await Promise.all(promises)
}
