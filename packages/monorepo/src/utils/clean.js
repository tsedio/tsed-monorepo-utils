import fs from 'fs-extra'
import { globAsync } from './glob'

export async function clean (patterns) {
  const files = await globAsync(patterns.filter(file => file.includes('*')), {
    onlyFiles: false
  })

  const promises = files
    .concat(
      patterns.filter(file => !file.includes('*'))
    )
    .map((file) => fs.remove(file))

  return Promise.all(promises)
}
