import {globby} from "globby";
import fs from "fs-extra";
import {writePackage} from "./writePackage.js";

const PACKAGE_JSON_PROPS = ["dependencies", "devDependencies", "peerDependencies"];

/**
 * @param version {string}
 * @param context {MonoRepo}
 * @returns {Promise<void>}
 */
export async function bumpPackagesVersion(version, context) {
  const {workspaces, cwd} = context;
  const patterns = workspaces.map((path) => `${path}/package.json`).concat("package.json");

  const files = await globby(patterns, {
    cwd,
    absolute: true
  });

  const names = new Set();

  const packages = await Promise.all(
    files.map(async (file) => {
      const pkg = await fs.readJson(file);

      names.add(pkg.name);

      return {file, pkg};
    })
  );

  packages.map(({pkg, file}) => {
    pkg.version = version;

    PACKAGE_JSON_PROPS.forEach((key) => bumpDependencies(pkg, key, version, names));

    return writePackage(file, pkg);
  });
}

function bumpDependencies(pkg, key, version, names) {
  if (pkg[key]) {
    names.forEach((name) => {
      if (pkg[key][name] && !pkg[key][name].startsWith("workspace:")) {
        pkg[key][name] = key === "peerDependencies" ? `>=${version}` : version;
      }
    });
  }
}
