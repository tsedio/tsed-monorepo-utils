import {lerna} from "../cli/index.js";
/**
 *
 * @param context {MonoRepo}
 */
export async function newVersion(context) {
  const {hasLerna} = context

  if (hasLerna) {
    lerna.newVersion(context.version, context);
  }

  return context.manager.newVersion(context.version, context);
}
