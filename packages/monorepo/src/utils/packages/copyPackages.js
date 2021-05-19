import {existsSync, readFileSync} from "fs";
import {dirname} from "path";
import {copy} from "../common/copy";
import {findPackages} from "./findPackages";

function getPatternsFormNmpIgnore(file, baseDir) {
  if (existsSync(file)) {
    return readFileSync(file, {encoding: "utf8"})
      .split("\n")
      .filter(Boolean)
      .map((rule) => `!${baseDir}/${rule}`);
  }

  return [];
}

/**
 *
 * @param context {MonoRepo}
 */
export async function copyPackages(context) {
  const {rootDir, outputDir, ignore = []} = context;
  const packages = await findPackages(context);

  const promises = packages.map(async (pkg) => {
    const baseDir = pkg.path.replace("package.json", "").replace(rootDir, "");
    const file = pkg.path.replace("package.json", ".npmignore");

    const patterns = [
      `${baseDir}/**`,
      `${baseDir}/**/.*`,
      `!${baseDir}/tsconfig.compile.json`,
      `!${baseDir}/test/**`,
      `!${baseDir}/package-lock.json`,
      `!${baseDir}/yarn.lock`,
      `!${baseDir}/node_modules/**`,
      ...getPatternsFormNmpIgnore(file, baseDir)
    ];

    await copy(patterns, {
      baseDir: dirname(pkg.path),
      outputDir
    });
  });

  await Promise.all(promises);
}
