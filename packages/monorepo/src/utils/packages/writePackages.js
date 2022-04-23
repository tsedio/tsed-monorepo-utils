import {join} from "path";
import chalk from "chalk";
import logger from "fancy-log";
import {writePackage} from "./writePackage.js";
import {findPackages} from "./findPackages.js";

const noop = (p) => p;

/**
 *
 * @param context {MonoRepo}
 * @returns {Promise<void[]>}
 */
export async function writePackages(context) {
  const {outputDir, silent, ignore = [], pkgMapper = noop, branchName} = context;
  let {npmDistTag} = context;

  if (["alpha", "beta", "rc"].includes(branchName)) {
    npmDistTag = branchName;
  }

  const packages = await findPackages(context);

  const promises = packages.map(async ({name, path, pkg}) => {
    !silent && logger("Write package.json", chalk.cyan(pkg.name));

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

    return writePackage(join(outputDir, name, "package.json"), pkg);
  });

  await Promise.all(promises);
}
