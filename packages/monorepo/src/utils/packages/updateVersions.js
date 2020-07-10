import semver from 'semver'
import chalk from 'chalk'

export function updateVersions (field = {}, dependencies, context) {
  const { char = '', silent, logger } = context

  Object
    .entries(field)
    .forEach(([mod, version]) => {
      if (dependencies.has(mod)) {
        const currentVersion = version.replace(/^\^/, '')
        const newVersion = dependencies.get(mod)
        if (semver.lt(currentVersion, newVersion)) {
          field[mod] = char + newVersion

          !silent && logger.info('Update', chalk.blue(mod), chalk.cyan(currentVersion), 'to', chalk.cyan(char + newVersion))
        }
      }
    })

  return field
}
