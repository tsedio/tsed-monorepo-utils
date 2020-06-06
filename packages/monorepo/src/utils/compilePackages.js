import { lerna } from './cli'
import chalk from 'chalk'
import { dirname, join } from 'path'
import { findPackages } from './findPackages'

export async function compilePackages (context) {
  const {
    rootDir,
    packagesDir,
    buildCmd = 'build',
    env,
    logger,
    manager,
    hasLerna
  } = context

  if (hasLerna) {
    const child = lerna.run(buildCmd, '--stream').toStream()

    child.stdout.on('data', data => {
      data
        .toString()
        .split('\n')
        .filter(line => !!line.trim())
        .map((line) => {
          logger.info(line)
        })
    })
    child.stderr.on('data', data => {
      data
        .toString()
        .split('\n')
        .filter(line => !!line.trim())
        .map((line) => {
          logger.error(line)
        })
    })

    await child
  } else {
    const pkgs = await findPackages({
      cwd: join(rootDir, packagesDir)
    })

    for (const { path, name, pkg } of pkgs) {
      const cwd = dirname(path)
      const child = manager.run(buildCmd).sync({
        cwd
      })

      child.stdout.on('data', data => {
        data
          .toString()
          .split('\n')
          .filter(line => !!line.trim())
          .map((line) => {
            logger.info(chalk.magenta(pkg.name), line.replace(/^ > /, ''))
          })
      })
      child.stderr.on('data', data => {
        data
          .toString()
          .split('\n')
          .filter(line => !!line.trim())
          .map((line) => {
            logger.error(chalk.red(pkg.name), line.replace(/^ > /, ''))
          })
      })

      await child
    }
  }

}
