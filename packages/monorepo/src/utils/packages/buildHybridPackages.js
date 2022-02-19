import {dirname, join} from "path";
import chalk from "chalk";
import logger from "fancy-log";
import {writePackage} from "./writePackage";
import {findPackages} from "./findPackages";
import {addJsExtension} from "./addJsExtension";

/**
 *
 * @param context {MonoRepo}
 * @returns {Promise<void[]>}
 */
export async function buildHybridPackages(context) {
  const {outputDir, silent, ignore = []} = context;

  const packages = await findPackages(context);

  const promises = packages.map(async ({name, path, pkg}) => {
    !silent && logger("Build hybrid package", chalk.cyan(pkg.name));
    const packageDir = join(outputDir, name);

    if (pkg.exports) {
      if (pkg.exports.import && pkg.exports.require) {
        const esmDir = join(packageDir, dirname(pkg.exports.import));
        const commonJsDir = join(packageDir, dirname(pkg.exports.require));

        await Promise.all([
          addJsExtension(esmDir, context),
          writePackage(join(esmDir, "package.json"), {type: "module"}),
          writePackage(join(commonJsDir, "package.json"), {type: "commonjs"})
        ]);
      }
    }
  });

  await Promise.all(promises);
}
