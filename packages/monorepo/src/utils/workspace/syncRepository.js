import {git} from "../cli/index.js";

async function asyncCatchError(fn, context) {
  try {
    return await fn();
  } catch (er) {
    context.logger.error(String(er), er.stack);
  }
}

/**
 *
 * @param context {MonoRepo}
 */
export async function syncRepository(context) {
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
