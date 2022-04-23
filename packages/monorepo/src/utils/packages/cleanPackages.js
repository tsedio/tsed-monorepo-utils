import {dirname, join} from "path";
import {clean} from "../common/clean.js";
import {findPackages} from "./findPackages.js";

/**
 *
 * @param context {MonoRepo}
 */
export async function cleanPackages(context) {
  const packages = await findPackages(context);

  const patterns = packages.reduce(
    (patterns, {path}) => {
      const base = dirname(path);
      return [...patterns, join(base, "esm"), join(base, "types"), join(base, "lib"), join(base, "dist")];
    },
    [join(context.rootDir, context.outputDir), "test/**/*.{js,js.map,d.ts}", "test/**/*.{js,js.map,d.ts}"]
  );

  await clean(patterns);
}
