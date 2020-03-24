const { join } = require('path')
const { copy } = require('./copy')
const { findPackages } = require('./findPackages')

exports.copyPackages = async ({ rootDir, outputDir, packagesDir = 'packages', silent = false, ignore = [] }) => {
  const packages = (await findPackages({
    cwd: join(rootDir, packagesDir)
  }))

  const names = packages.map(({ name }) => name).join(',')

  await copy([
    `${packagesDir}/{${names}}/**`,
    `${packagesDir}/{${names}}/**/.*`,
    `!${packagesDir}/*/tsconfig.compile.json`,
    `!${packagesDir}/*/src/**`,
    `!${packagesDir}/*/test/**`,
    `!${packagesDir}/*/package-lock.json`,
    `!${packagesDir}/*/yarn.lock`,
    `!${packagesDir}/*/node_modules/**`
  ], {
    baseDir: packagesDir,
    outputDir
  })
}
