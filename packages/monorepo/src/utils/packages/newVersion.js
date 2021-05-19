import {lerna} from "../cli";
/**
 *
 * @param context {MonoRepo}
 */
export async function newVersion(context) {
  if (context.hasLerna) {
    lerna.newVersion(context.version);
  }

  return context.manager.newVersion(context.version);
}
