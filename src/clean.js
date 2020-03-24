const fs = require('fs-extra')
const { globAsync } = require('./glob')

exports.clean = async (patterns) => {
  const files = await globAsync(patterns)
  const promises = files.map((file) => fs.remove(file))

  return Promise.all(promises)
}
