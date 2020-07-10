import get from 'lodash/get'

export function defaultPackageMapper (pkg, { packagesDir, name, rootPkg }) {
  const { bugs, author, license, gitHead, contributors } = rootPkg
  const repository = get(rootPkg, 'repository.url', get(rootPkg, 'repository', ''))
    .replace(/\.git/gi, '')
    .replace(/git:\/\//gi, 'https://')

  return {
    ...pkg,
    main: pkg.main.endsWith('.ts') ? 'lib/index.js' : pkg.main,
    typings: pkg.main.endsWith('.ts') ? 'lib/index.d.ts' : pkg.typings,
    repository,
    bugs,
    homepage: `${rootPkg.repository.url}/${packagesDir.replace('./', '')}/${name}`,
    author,
    contributors,
    license,
    gitHead
  }
}
