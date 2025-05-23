import {dirname, join} from "path";
import chalk from "chalk";
import logger from "fancy-log";
import {writePackage} from "./writePackage.js";
import {findPackages} from "./findPackages.js";
import {transformCjsFileToEsm, transformEsmFileToCjs} from "./transformCjsFileToEsm.js";
import {readPackage} from "./readPackage.js";

export async function buildHybridPackage(distPath, pkg, context) {
  const {silent, ignore = []} = context;

  if (!pkg) {
    pkg = readPackage(join(distPath, "package.json"));
  }

  !silent && logger("Build hybrid package", chalk.cyan(pkg.name));

  if (pkg.exports) {
    if ((pkg.exports.import && pkg.exports.require) || (pkg.exports["."]?.import && pkg.exports["."]?.require)) {
      const esmDir = join(distPath, dirname(pkg.exports["."]?.import || pkg.exports.import));
      const commonJsDir = join(distPath, dirname(pkg.exports["."]?.require || pkg.exports.require));

      await Promise.all([
        transformCjsFileToEsm(esmDir, context),
        transformEsmFileToCjs(commonJsDir, context),
        writePackage(join(esmDir, "package.json"), {type: "module"}),
        writePackage(join(commonJsDir, "package.json"), {type: "commonjs"})
      ]);
    }
  }
}

/**
 *
 * @param context {MonoRepo}
 * @returns {Promise<void[]>}
 */
export async function buildHybridPackages(context) {
  const {outputDir, silent, ignore = []} = context;

  const packages = await findPackages(context);

  const promises = packages.map(async ({distPath, pkg}) => {
    await buildHybridPackage(distPath, pkg, context);
  });

  await Promise.all(promises);
}
