import get from "lodash/get.js";
/**
 *
 * @param pkgInfo {{name: string, pkg: any, path: string}}
 * @param context {MonoRepo}
 */
export function defaultPackageMapper(pkgInfo, context) {
  const {pkg, path} = pkgInfo;
  const {productionBranch, rootPkg, rootDir} = context;
  const {bugs, author, license, gitHead, contributors} = rootPkg;

  const repository = get(rootPkg, "repository.url", get(rootPkg, "repository", ""))
    .replace(/\.git/gi, "")
    .replace(/git:\/\//gi, "https://");

  const packageName = path.replace(rootDir, "").replace("/package.json", "");
  const subpath = `/tree/${productionBranch}/${packageName}`.replace("//", "/");

  return {
    ...pkg,
    main: (pkg.main || "").replace(/\.ts$/, ".js"),
    typings: pkg.typings && !pkg.typings.endsWith(".d.ts") ? pkg.typings.replace(/\.ts/, ".d.ts") : pkg.typings,
    repository,
    bugs,
    homepage: `${repository}${subpath}`,
    author,
    contributors,
    license,
    gitHead
  };
}
