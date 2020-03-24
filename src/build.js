const chalk = require('chalk')
const logger = require('fancy-log')
const { compilePackages } = require('./compilePackages')
const { copyPackages } = require('./copyPackage')
const { writePackages } = require('./writePackages')
const { syncDependencies } = require('./syncDependencies')
const { clean } = require('./clean')

exports.build = async (options) => {
  const { silent } = options
  !silent && logger(`Starting '${chalk.cyan('monorepo:clean')}'...`)

  await clean([
    options.outputDir
  ])

  !silent && logger(`Finished '${chalk.cyan('monorepo:clean')}'`)
  !silent && logger(`Starting '${chalk.cyan('monorepo:compilePackages')}'...`)

  await compilePackages(options)

  !silent && logger(`Finished '${chalk.cyan('monorepo:compilePackages')}'`)
  !silent && logger(`Starting '${chalk.cyan('monorepo:syncDependencies')}'...`)

  await syncDependencies(options)

  !silent && logger(`Finished '${chalk.cyan('monorepo:syncDependencies')}'...`)
  !silent && logger(`Starting '${chalk.cyan('monorepo:copyPackages')}'...`)

  await copyPackages(options)

  !silent && logger(`Finished '${chalk.cyan('monorepo:copyPackages')}'`)
  !silent && logger(`Starting '${chalk.cyan('monorepo:writePackages')}'...`)

  await writePackages(options)

  !silent && logger(`Finished '${chalk.cyan('repo:writePackages')}'`)
}
