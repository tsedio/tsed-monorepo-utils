const fs = require('fs-extra')
const { globAsync } = require('./glob')

exports.clean = async (patterns) => {
  const files = await globAsync(patterns.filter(file => file.includes('*')))

  const promises = files
    .concat(
      patterns.filter(file => !file.includes('*'))
    )
    .map((file) => fs.remove(file))

  return Promise.all(promises)
}
