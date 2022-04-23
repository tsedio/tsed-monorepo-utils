import {git} from "../cli/Git.js";

export function getCI() {
  const {env} = process;
  const {GIT_USER_NAME, GIT_USER_EMAIL} = env;
  if (env.CI) {
    if (env.TRAVIS) {
      const {TRAVIS_BUILD_NUMBER, TRAVIS_COMMIT, TRAVIS_PULL_REQUEST, TRAVIS_BRANCH} = env;

      return {
        CI_NAME: "Travis CI",
        USER: GIT_USER_NAME || "Travis CI",
        EMAIL: GIT_USER_EMAIL || "travis@travis-ci.org",
        BUILD_NUMBER: TRAVIS_BUILD_NUMBER,
        CI_ORIGIN: "origin-git",
        REF_COMMIT: TRAVIS_COMMIT,
        IS_PULL_REQUEST: TRAVIS_PULL_REQUEST && TRAVIS_PULL_REQUEST !== "false",
        BRANCH_NAME: TRAVIS_BRANCH
      };
    }

    if (env.GITLAB_CI) {
      const {CI_BUILD_ID, CI_JOB_ID, CI_COMMIT_SHA, CI_COMMIT_BRANCH} = env;

      return {
        CI_NAME: "GitLab CI",
        USER: GIT_USER_NAME || "GitLab CI",
        EMAIL: GIT_USER_EMAIL || "gitlab@gitlab.com",
        BUILD_NUMBER: CI_BUILD_ID || CI_JOB_ID,
        CI_ORIGIN: "origin-git",
        REF_COMMIT: CI_COMMIT_SHA,
        IS_PULL_REQUEST: false,
        BRANCH_NAME: CI_COMMIT_BRANCH
      };
    }

    if (env.CIRCLECI) {
      const {CIRCLE_BUILD_NUM, CIRCLE_SHA1, CIRCLE_PULL_REQUEST, CIRCLE_BRANCH} = env;
      return {
        CI_NAME: "Circle CI",
        USER: GIT_USER_NAME || "Circle CI",
        EMAIL: GIT_USER_EMAIL || "circle@circleci.com",
        BUILD_NUMBER: CIRCLE_BUILD_NUM,
        CI_ORIGIN: "origin-git",
        REF_COMMIT: CIRCLE_SHA1,
        IS_PULL_REQUEST: CIRCLE_PULL_REQUEST && CIRCLE_PULL_REQUEST !== "false",
        BRANCH_NAME: CIRCLE_BRANCH
      };
    }

    if (env.GITHUB_ACTION) {
      const {GITHUB_ACTION, GITHUB_SHA, GITHUB_REF, GITHUB_ACTOR} = env;
      return {
        CI_NAME: "Github CI",
        USER: GIT_USER_NAME || GITHUB_ACTOR || "Github CI",
        EMAIL: GIT_USER_EMAIL || "action@github.com",
        BUILD_NUMBER: GITHUB_ACTION,
        CI_ORIGIN: "origin-git",
        REF_COMMIT: GITHUB_SHA,
        IS_PULL_REQUEST: false,
        BRANCH_NAME: GITHUB_REF.replace("refs/heads/", "")
      };
    }

    return {
      CI: false,
      CI_NAME: "Unsupported CI",
      BUILD_NUMBER: "",
      CI_ORIGIN: "origin-git",
      IS_PULL_REQUEST: false,
      BRANCH_NAME: git.getBranchName()
    };
  }
  // / local
  return {
    CI_NAME: "LOCAL",
    BUILD_NUMBER: "1",
    CI_ORIGIN: "origin-git",
    BRANCH_NAME: git.getBranchName()
  };
}
