import chalk from "chalk";
import {existsSync} from "fs";
import {join} from "path";
import {getDependencies} from "../depencencies/getDependencies.js";
import {findPackages} from "../packages/findPackages.js";
import {readPackage} from "../packages/readPackage.js";
import {updateVersions} from "../packages/updateVersions.js";
import {writePackage} from "../packages/writePackage.js";

/**
 *
 * @param context {MonoRepo}
 * @returns {Promise<*>}
 */
async function resolveDependencies(context) {
  const {rootDir} = context;
  const dependenciesMap = await getDependencies(join(rootDir, "package.json"));

  const packages = await findPackages(context);

  packages.forEach(({pkg: {name, version, devDependencies, dependencies}}) => {
    dependenciesMap.set(name, version);

    Object.entries({
      ...dependencies,
      ...devDependencies
    }).forEach(([key, value]) => {
      dependenciesMap.set(key, value.replace(/^\^/, ""));
    });
  });

  return dependenciesMap;
}

async function updatePackage(pkgPath, context) {
  const {logger, silent = false} = context;

  const currentPkg = await readPackage(pkgPath);
  const dependencies = await resolveDependencies(context);

  !silent && logger("Update package", chalk.cyan(pkgPath));

  currentPkg.dependencies = updateVersions(currentPkg.dependencies, dependencies, {}, context);
  currentPkg.devDependencies = updateVersions(currentPkg.devDependencies, dependencies, {}, context);

  await writePackage(pkgPath, currentPkg);
}

export async function syncExampleDependencies(projectOptions, context) {
  const cwd = projectOptions.tmpDir;
  const pkgPath = join(cwd, "/package.json");

  await updatePackage(pkgPath, context);

  const lernaProjectPath = join(cwd, "packages");

  if (existsSync(lernaProjectPath)) {
    await updatePackage(join(lernaProjectPath, "server", "package.json"), context);
  }
}
