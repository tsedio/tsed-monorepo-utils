const logger = require('fancy-log')
const chalk = require('chalk')
const { sync } = require('execa')
const fs = require('fs-extra')
const { join, dirname } = require('path')
const { findPackages } = require('./findPackages')

function writeNpmrc (path, registry) {
  const npmrc = join(path, '.npmrc')
  registry = registry.replace('https:', '').replace('http:', '')

  fs.writeFileSync(npmrc, registry + ':_authToken=${NPM_TOKEN}', { encoding: 'utf8' })

  return npmrc
}

exports.publishPackages = async (options) => {
  const {
    rootDir,
    silent = false,
    npmAccess,
    dryRun = false,
    registry = 'https://registry.npmjs.org/'
  } = options

  const pkgs = await findPackages({
    cwd: rootDir
  })

  pkgs
    .filter(({ pkg }) => !pkg.private)
    .map(({ path, pkg }) => {
      !silent && logger('Publish package', chalk.cyan(pkg.name))

      const cwd = dirname(path)

      try {
        const npmrc = writeNpmrc(path, cwd, registry)

        if (dryRun) {
          sync('npm', ['pack'], {
            cwd,
            stdio: 'inherit'
          })
        } else {
          sync('npm',
            [
              'publish',
              '--userconfig', npmrc,
              '--access', npmAccess,
              '--registry', registry
            ],
            {
              cwd,
              stdio: 'inherit'
            })
        }

      } catch (er) {
        logger(chalk.red(er.message), chalk.red(er.stack))
      }

      return undefined
    })

  return Promise.resolve()
}
