import {join} from "path";
import chalk from "chalk";
import {writePackage} from "./writePackage.js";
import {findPackages} from "./findPackages.js";
import {updateVersions} from "./updateVersions.js";

const noop = (p) => p;

/**
 * @param context {MonoRepo}
 * @returns {Promise<void[]>}
 */
export async function writePackages(context) {
  const {silent, logger, ignore = [], pkgMapper = noop, branchName, rootPkg, dependencies, ignoreSyncDependencies} = context;
  let {npmDistTag} = context;

  if (["alpha", "beta", "rc"].includes(branchName)) {
    npmDistTag = branchName;
  }

  const packages = await findPackages(context);

  ignoreSyncDependencies.map((pkg) => {
    dependencies.delete(pkg);
  });

  packages.map(({pkg}) => {
    // set the same version for all packages (root version)
    pkg.version = context.version;
    dependencies.set(pkg.name, pkg.version);
  });

  const promises = packages.map(async ({distPath, name, path, pkg}) => {
    !silent && logger("Write package.json", chalk.cyan(pkg.name));

    pkg.dependencies = updateVersions(pkg.dependencies, dependencies, {}, context);
    pkg.devDependencies = updateVersions(pkg.devDependencies, dependencies, {}, context);
    pkg.peerDependencies = updateVersions(pkg.peerDependencies, dependencies, {char: "^"}, context);

    pkg = pkgMapper({pkg, path, name}, context);

    if (npmDistTag) {
      pkg.publishConfig = {
        ...(pkg.publishConfig || {}),
        tag: npmDistTag
      };
    }

    if (pkg.main.includes("/src/index.ts")) {
      pkg.main = "./lib/index.js";
      pkg.typings = "lib/index.d.ts";
    }

    Object.entries(pkg.dependencies || {}).forEach(([name, version]) => {
      if (version.startsWith("workspace:")) {
        pkg.dependencies[name] = version.replace("workspace:*", rootPkg.version);
      }
    });

    Object.entries(pkg.devDependencies || {}).forEach(([name, version]) => {
      if (version.startsWith("workspace:")) {
        pkg.devDependencies[name] = version.replace("workspace:*", rootPkg.version);
      }
    });

    return writePackage(join(distPath, "package.json"), pkg);
  });

  await Promise.all(promises);
}
