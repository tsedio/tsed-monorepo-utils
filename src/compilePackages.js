const { execa } = require('execa')
const { dirname } = require('path')
const { findPackages } = require('./findPackages')

exports.compilePackages = async (options) => {
  const {
    rootDir,
    buildCmd = 'build'
  } = options

  const pkgs = await findPackages({
    cwd: rootDir
  })

  const promises = pkgs.map(({ path, name, pkg }) => {
    const cwd = dirname(path)

    return execa('npm', [buildCmd], {
      cwd,
      stdio: 'inherit'
    })
  })

  return await Promise.all(promises)
}
