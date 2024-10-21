import {git} from "../cli/index.js";
/**
 *
 * @param context {MonoRepo}
 */
export async function syncRepository(context) {
  const {logger, productionBranch, developBranch, branchName, origin} = context;
  try {
    logger.info(`Push ${productionBranch}`);
    await git.push("--quiet", "--set-upstream", origin, productionBranch);

    if (productionBranch !== developBranch) {
      logger.info(`Sync ${developBranch} with ${productionBranch}`);
      await git.push("-f", origin, `${productionBranch}:refs/heads/${developBranch}`);
    }
  } catch (er) {
    logger.error(String(er), er.stack);
  }

  if (["alpha", "beta", "rc"].includes(branchName)) {
    try {
      logger.info(`Push ${branchName}`);
      await git.push("--quiet", "--set-upstream", origin, branchName);
    } catch (er) {
      logger.error(`Fail to Push ${branchName}`);
    }
  }
}
