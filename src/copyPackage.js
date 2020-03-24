const { findPackages } = require('./findPackages')

exports.copyPackages = ({ rootDir, packagesDir = 'packages', silent = false, ignore = [] }) => {
  const packages = (await findPackages({}))

  packages.map(p).join(',')

  await copy([
    `${packagesDir}/{${packages}}/**`,
    `${packagesDir}/{${packages}}/**/.*`,
    `!${packagesDir}/*/tsconfig.compile.json`,
    `!${packagesDir}/*/src/**`,
    `!${packagesDir}/*/test/**`,
    `!${packagesDir}/*/package-lock.json`,
    `!${packagesDir}/*/yarn.lock`,
    `!${packagesDir}/*/node_modules/**`
  ], {
    baseDir: packagesDir,
    outputDir: `./${path.join(outputDir)}`
  })
}
