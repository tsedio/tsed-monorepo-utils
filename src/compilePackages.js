const { sync } = require('execa')
const { dirname, join } = require('path')
const { findPackages } = require('./findPackages')

exports.compilePackages = async (options) => {
  const {
    rootDir,
    packagesDir,
    buildCmd = 'build'
  } = options

  const pkgs = await findPackages({
    cwd: join(rootDir, packagesDir)
  })

  for (const { path, name, pkg } of pkgs) {
    const cwd = dirname(path)

    sync('npm', ['run', buildCmd], {
      cwd,
      stdio: 'inherit'
    })
  }
}
