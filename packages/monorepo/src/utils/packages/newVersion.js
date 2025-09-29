import {writePackage} from "./writePackage.js";
import {join} from "path";

/**
 *
 * @param context {MonoRepo}
 */
export async function newVersion(context) {
  const {version} = context;
  context.rootPkg.version = version;

  await writePackage(join(context.rootDir, "package.json"), context.rootPkg);
  await context.manager.install();
}
