const logger = require('fancy-log')
const chalk = require('chalk')
const semver = require('semver')

exports.updateVersions = (field = {}, dependencies, { char = '', silent } = {}) => {
  Object
    .entries(field)
    .forEach(([mod, version]) => {
      if (dependencies.has(mod)) {
        const currentVersion = version.replace(/^\^/, '')
        const newVersion = dependencies.get(mod)
        if (semver.lt(currentVersion, newVersion)) {
          field[mod] = char + newVersion

          !silent && logger('Update', chalk.blue(mod), chalk.cyan(currentVersion), 'to', chalk.cyan(char + newVersion))
        }
      }
    })

  return field
}
