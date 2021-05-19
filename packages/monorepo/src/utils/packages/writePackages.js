import {join} from "path";
import chalk from "chalk";
import logger from "fancy-log";
import {writePackage} from "./writePackage";
import {findPackages} from "./findPackages";
import {readPackage} from "./readPackage";

const noop = (p) => p;

/**
 *
 * @param context {MonoRepo}
 * @returns {Promise<void[]>}
 */
export async function writePackages(context) {
  const {npmDistTag, outputDir, silent, ignore = [], pkgMapper = noop} = context;

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
