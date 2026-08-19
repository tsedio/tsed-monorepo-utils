import {git} from "../cli/index.js";
/**
 *
 * @param context {MonoRepo}
 */
export function commitChanges(context) {
  const {
    logger,
    repositoryUrl,
    origin,
    productionBranch,
    developBranch,
    env: {CI, CI_NAME, CI_SKIP, BUILD_NUMBER},
    version
  } = context;
  const repository = repositoryUrl.replace("https://", "");

  if (!CI) {
    logger.warn("Not in CI environment");
    return;
  }

  logger.info(`Generate release tag for v${version}`);
  logger.info(`REPOSITORY:      ${repository}`);
  logger.info(`RELEASE_BRANCH:  ${productionBranch}`);
  logger.info(`DEVELOP_BRANCH:  ${developBranch}`);
  logger.info(`BUILD:           ${BUILD_NUMBER}`);

  logger.info("Adding files to commit");
  git.add("-A").sync();

  logger.info("Reset .npmrc");
  git.reset("--", ".npmrc");

  logger.info(git.status());

  logger.info("Commit files");
  git.commit("-m", `${CI_NAME} build: ${BUILD_NUMBER} v${version} ${CI_SKIP}`).sync();

  // semantic-release creates and pushes the release tag after its prepare phase.
  // Push the generated release commit first so a publishing failure cannot leave
  // a remote tag ahead of the reference branch.
  const ref = `HEAD:refs/heads/${productionBranch}`;
  logger.info(`Push release commit to ${productionBranch}`);
  logger.info(`git push --quiet ${origin} ${ref}`);
  git.push("--quiet", origin, ref).sync();
}
