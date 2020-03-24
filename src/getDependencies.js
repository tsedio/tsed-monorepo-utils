const { join } = require('path')
const { readPackage } = require('./readPackage')

exports.getDependencies = async (path = join(process.cwd(), 'package.json')) => {
  const pkg = await readPackage(path)
  const map = new Map()

  Object.entries({
    ...pkg.dependencies,
    ...pkg.devDependencies
  }).forEach(([key, value]) => {
    map.set(key, value.replace(/^\^/, ''))
  })

  return map
}
