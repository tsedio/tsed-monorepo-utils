const { readPackage } = require('./readPackage')
const { basename, dirname } = require('path')
const { globAsync } = require('./glob')

exports.findPackages = async ({ cwd = join(process.cwd(), 'packages') }) => {
  const pkgs = await globAsync('*/package.json', {
    cwd,
    absolute: true
  })

  const promises = pkgs
    .map(async (file) => ({
      path: file,
      name: basename(dirname(file)),
      pkg: await readPackage(file)
    }))

  return Promise.all(promises)
}
