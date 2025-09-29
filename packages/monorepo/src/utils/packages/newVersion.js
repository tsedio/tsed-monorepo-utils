import {writePackage} from "./writePackage.js";

/**
 *
 * @param context {MonoRepo}
 */
export async function newVersion(context) {
  const {version} = context;
  context.rootPkg.version = version;

  await writePackage(context.rootPkg, context.rootPkg);
  await context.manager.install(context);
}
