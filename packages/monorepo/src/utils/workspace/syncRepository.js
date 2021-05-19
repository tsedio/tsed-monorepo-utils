import {git} from "../cli";
/**
 *
 * @param context {MonoRepo}
 */
export async function syncRepository(context) {
  const {logger, productionBranch, developBranch, origin} = context;
  try {
    logger.info(`Push to ${productionBranch}`);
    await git.push("--quiet", "--set-upstream", origin, productionBranch);

    if (productionBranch !== developBranch) {
      logger.info(`Sync ${developBranch} with ${productionBranch}`);
      await git.push("-f", origin, `${productionBranch}:refs/heads/${developBranch}`);
    }

    logger.info("Release tag are applied on git");
  } catch (er) {
    logger.error(String(er), er.stack);
  }
}
