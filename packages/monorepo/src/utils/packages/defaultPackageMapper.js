import get from 'lodash/get'

export function defaultPackageMapper (pkg, { packagesDir, productionBranch, name, rootPkg }) {
  const { bugs, author, license, gitHead, contributors } = rootPkg
  const repository = get(rootPkg, 'repository.url', get(rootPkg, 'repository', ''))
    .replace(/\.git/gi, '')
    .replace(/git:\/\//gi, 'https://')

  return {
    ...pkg,
    main: (pkg.main || '').replace(/\.ts$/, '.js'),
    typings: pkg.typings && !pkg.typings.endsWith('.d.ts') ? pkg.typings.replace(/\.ts/, '.d.ts') : pkg.typings,
    repository,
    bugs,
    homepage: `${repository}/tree/${productionBranch}/${packagesDir.replace('./', '')}/${name}`,
    author,
    contributors,
    license,
    gitHead
  }
}
