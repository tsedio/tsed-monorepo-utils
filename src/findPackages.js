const { readPackage } = require('./readPackage')
const { basename, dirname, join } = require('path')
const { globAsync } = require('./glob')

exports.findPackages = async ({ cwd = join(process.cwd(), 'packages') }) => {
  let pkgs = await globAsync('*/package.json', {
    cwd,
    absolute: true
  })

  const promises = pkgs
    .map(async (file) => ({
      path: file,
      name: basename(dirname(file)),
      pkg: await readPackage(file)
    }))

  pkgs = await Promise.all(promises)

  const pkgsMap = pkgs.reduce((map, data) => {
    map.set(data.pkg.name, data)
    return map
  }, new Map())

  const set = new Set()
  pkgs.forEach(({ pkg }) => {
    deps(pkg, pkgsMap, set)
  })

  return Array.from(set.keys()).map(mod => pkgsMap.get(mod))
}

function deps (pkg, pkgs, set = new Set()) {
  Object.keys({
    ...pkg.dependencies || {},
    ...pkg.devDependencies || {}
  }).forEach((name) => {
    if (pkgs.has(name)) {
      deps(pkgs.get(name).pkg, pkgs, set)

      set.add(name)
    }
  })
}
