import {git} from "../cli/index.js";

/**
 *
 * @param context {MonoRepo}
 */
export async function syncRepository(context) {
  async function asyncCatchError(fn) {
    try {
      return await fn();
    } catch (er) {
      context.logger.error(String(er), er.stack);
    }
  }

  const {logger, productionBranch, developBranch, branchName, origin} = context;

  await asyncCatchError(() => git.fetch());

  logger.info(`Push ${productionBranch}`);
  logger.info(`git push --quiet --set-upstream ${origin} ${productionBranch}`);

  await asyncCatchError(() => git.push("--quiet", "--set-upstream", origin, productionBranch));

  if (productionBranch !== developBranch) {
    logger.info(`Sync ${developBranch} with ${productionBranch}`);
    logger.info(`git push -f origin ${productionBranch}:refs/heads/${developBranch}`);

    await asyncCatchError(() => git.push("-f", origin, `${productionBranch}:refs/heads/${developBranch}`));
  }

  if (["alpha", "beta", "rc"].includes(branchName)) {
    await asyncCatchError(() => git.push("--quiet", "--set-upstream", origin, branchName));
  }
}
