const fs = require('fs-extra')
const { globAsync } = require('./glob')

exports.copy = async (patterns, { baseDir, outputDir }) => {
  const files = await globAsync(patterns)

  const promises = files.map((file) => fs.copy(file, file.replace(baseDir, outputDir)))

  return Promise.all(promises)
}
