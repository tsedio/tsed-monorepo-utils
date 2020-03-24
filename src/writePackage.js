const fs = require('fs-extra')

exports.writePackage = async (pkgPath, pkg) => {
  return fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2), { encoding: 'utf8' })
}
