import {docker} from "../cli/Docker.js";

/**
 *
 * @param context {MonoRepo}
 * @returns {Promise<void>}
 */
export async function publishDocker(context) {
  const {
    dockerhub: {id, pwd, repository},
    productionBranch
  } = context;

  if (id && pwd && repository) {
    docker.login("-u", id, "-p", pwd);

    const image =
      productionBranch === context.branch.name ? `${repository}:${context.nextRelease.version}` : `${repository}:${context.branch.name}`;

    docker.tag(`${repository}:latest`, image);

    await docker.push(image);
  }
}
