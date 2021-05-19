import {globAsync} from "../common/glob";
import {basename, dirname, join} from "path";
import {readPackage} from "./readPackage";

function deps(pkg, pkgs, set = new Set()) {
  Object.keys({
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {})
  }).forEach((name) => {
    if (pkgs.has(name)) {
      deps(pkgs.get(name).pkg, pkgs, set);
    }
  });
  set.add(pkg.name);
}

/**
 * Find all packages from workspaces configuration
 * @param context {MonoRepo}
 * @returns {Promise<{name: string, path: string, pkg: any}[]>}
 */
export async function findPackages(context) {
  const patterns = context.workspaces.map((pkgPattern) => {
    return `${pkgPattern}/package.json`;
  });

  let pkgs = await globAsync(patterns, {
    cwd: context.cwd,
    absolute: true
  });

  const promises = pkgs.map(async (file) => ({
    path: file,
    name: basename(dirname(file)),
    pkg: readPackage(file)
  }));

  pkgs = await Promise.all(promises);

  const pkgsMap = pkgs.reduce((map, data) => {
    map.set(data.pkg.name, data);
    return map;
  }, new Map());

  const set = new Set();
  pkgs.forEach(({pkg}) => {
    deps(pkg, pkgsMap, set);
  });

  return [...set.keys()].map((mod) => pkgsMap.get(mod));
}
