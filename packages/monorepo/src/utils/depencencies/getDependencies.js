import { join } from 'path'
import { readPackage } from '../packages/readPackage'


export function getDependencies (path = join(process.cwd(), 'package.json')) {
  const pkg = readPackage(path)
  const map = new Map()

  Object.entries({
    ...pkg.dependencies,
    ...pkg.devDependencies
  }).forEach(([key, value]) => {
    map.set(key, value.replace(/^\^/, ''))
  })

  return map
}
