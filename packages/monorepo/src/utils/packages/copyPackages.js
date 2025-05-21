import {existsSync, readFileSync} from "fs";
import {dirname, basename, join} from "path";
import {copy} from "../common/copy.js";
import {findPackages} from "./findPackages.js";

function getPatternsFormNmpIgnore(file) {
  if (existsSync(file)) {
    return readFileSync(file, {encoding: "utf8"})
      .split("\n")
      .filter(Boolean)
      .map((o) => `!${o}`);
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
    const pkgDir = dirname(pkg.path);
    const dirName = basename(pkgDir);
    const file = pkg.path.replace("package.json", ".npmignore");

    const patterns = [
      "*",
      "*/**",
      ".*",
      "**/.*",
      "!tsconfig.compile.json",
      "!test/**",
      "!package-lock.json",
      "!yarn.lock",
      "!node_modules/**",
      ...getPatternsFormNmpIgnore(file)
    ];

    await copy(patterns, {
      baseDir: pkgDir,
      outputDir: pkg.distPath
    });
  });

  await Promise.all(promises);
}
