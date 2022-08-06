/**
 *
 * @param context {MonoRepo}
 * @returns {Promise<void>}
 */
export async function compilePackages(context) {
  return context.workspaceManager.runMany(context.buildCmd, [], context);
}
