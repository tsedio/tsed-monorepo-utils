import { readFileSync } from 'fs'

export function readPackage (path = './package.json') {
  return JSON.parse(readFileSync(path, { encoding: 'utf8' }))
}
