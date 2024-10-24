import {git} from "../cli/index.js";

function asyncCatchError(fn, context) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (er) {
      context.logger.error(String(er), er.stack);
    }
  };
}

/**
 *
 * @param context {MonoRepo}
 */
export async function syncRepository(context) {
  const {logger, productionBranch, developBranch, branchName, origin} = context;

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
