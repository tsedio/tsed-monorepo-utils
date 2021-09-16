import chalk from "chalk";
import {join} from "path";
import {updateVersions} from "../packages/updateVersions";
import {writePackage} from "../packages/writePackage";
import {findPackages} from "../packages/findPackages";

/**
 *
 * @param context {MonoRepo}
 * @returns {Promise<void>}
 */
export async function syncDependencies(context) {
  const {logger, dependencies, silent, ignoreSyncDependencies} = context;
  const packages = await findPackages(context);

  ignoreSyncDependencies.map((pkg) => {
    dependencies.delete(pkg);
  });

  packages.map(({pkg}) => {
    dependencies.set(pkg.name, pkg.version);
  });

  const promises = packages.map(async ({path, pkg}) => {
    !silent && logger.info("Update package.json", chalk.cyan(pkg.name));

    pkg.dependencies = updateVersions(pkg.dependencies, dependencies, {}, context);
    pkg.devDependencies = updateVersions(pkg.devDependencies, dependencies, {}, context);
    pkg.peerDependencies = updateVersions(pkg.peerDependencies, dependencies, {char: "^"}, context);

    return writePackage(path, pkg);
  });

  await Promise.all(promises);
}
