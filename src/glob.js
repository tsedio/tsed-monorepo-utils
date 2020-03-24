const globby = require('globby')
const normalizePath = require('normalize-path')

exports.globSync = (patterns, options) => globby.sync(patterns, options)
  .map(file => normalizePath(file))

exports.globAsync = async (patterns, options) => {
  const files = await globby(patterns, options)
  return files.map(file => normalizePath(file))
}
