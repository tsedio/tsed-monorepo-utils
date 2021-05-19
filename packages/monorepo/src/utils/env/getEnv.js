import {getCI} from "./getCi";

export function getEnv(pkg) {
  const [owner, projectName] = pkg.name.replace(/^@/, "").split("/");
  const {
    PROJECT_NAME,
    DOCKER_HUB_ID,
    DOCKER_HUB_PWD,
    REF_COMMIT,
    GH_TOKEN,
    GITHUB_TOKEN,
    REPOSITORY_URL,
    ORIGIN,
    CI_SKIP,
    REGISTRY_URL,
    HEROKU_APP,
    HEROKU_API_KEY,
    HEROKU_TEAM,
    CI
  } = process.env;

  return {
    CI,
    PROJECT_NAME: PROJECT_NAME || projectName,
    DEPLOY_ON_DOCKER: DOCKER_HUB_ID && DOCKER_HUB_PWD && +DEPLOY_DOCKER_HUB === 1,
    CI_SKIP: CI_SKIP || "[ci skip]",
    ORIGIN,
    get PRODUCTION_BRANCH() {
      return process.env.PRODUCTION_BRANCH;
    },
    get DEVELOP_BRANCH() {
      return process.env.DEVELOP_BRANCH;
    },
    get OWNER() {
      return process.env.OWNER || owner;
    },
    get DOCKER_REPOSITORY() {
      const {DOCKER_REPOSITORY, OWNER, PROJECT_NAME} = process.env;
      return DOCKER_REPOSITORY || `${OWNER || owner}/${PROJECT_NAME || projectName}`;
    },
    DOCKER_HUB_ID,
    DOCKER_HUB_PWD,
    REF_COMMIT,
    GH_TOKEN: GH_TOKEN || GITHUB_TOKEN,
    REPOSITORY_URL,
    REGISTRY_URL,
    HEROKU_APP,
    HEROKU_API_KEY,
    HEROKU_TEAM,
    ...getCI()
  };
}
