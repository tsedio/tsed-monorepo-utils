import _ from "lodash";
import hasYarn from "has-yarn";
import logger from "fancy-log";
import {join} from "path";
import {lerna, npm, nx, yarn} from "./utils/cli/index.js";
import {getDependencies} from "./utils/depencencies/getDependencies.js";
import {syncExamples} from "./utils/examples/syncExample.js";
import {syncDependencies} from "./utils/depencencies/syncDependencies.js";
import {publishPackages} from "./utils/packages/publishPackages.js";
import {readPackage} from "./utils/packages/readPackage.js";
import {getEnv} from "./utils/env/getEnv.js";
import {configureWorkspace} from "./utils/workspace/configureWorkspace.js";
import {commitChanges} from "./utils/workspace/commitChanges.js";
import {build} from "./tasks/build.js";
import {syncRepository} from "./utils/workspace/syncRepository.js";
import {createTasksRunner} from "./utils/common/createTasksRunner.js";
import {newVersion} from "./utils/packages/newVersion.js";
import {publishGhPages} from "./utils/ghpages/publishGhPages.js";
import {publishExamples} from "./utils/examples/publishExamples.js";
import {defaultPackageMapper} from "./utils/packages/defaultPackageMapper.js";
import {publishDocker} from "./utils/docker/publishDocker.js";
import {publishHeroku} from "./utils/heroku/publishHeroku.js";
import {cleanTagsDocker} from "./utils/docker/cleanTagsDocker.js";
import {getWorkspaces} from "./utils/workspace/getWorkspaces.js";
import {cleanPackages} from "./utils/packages/cleanPackages.js";
import {yarnBerry} from "./utils/cli/YarnBerry.js";
import {buildHybridPackage, buildHybridPackages} from "./utils/packages/buildHybridPackages.js";

function getDefaultOptions(rootPkg) {
  return {
    version: _.get(rootPkg, "version"),
    outputDir: _.get(rootPkg, "monorepo.outputDir", "./dist"),
    npmAccess: _.get(rootPkg, "monorepo.npmAccess", "public"),
    npmDistTag: _.get(rootPkg, "monorepo.npmDistTag", _.get(rootPkg, "publishConfig.tag")),
    skipNpmPublish: _.get(rootPkg, "monorepo.skipNpmPublish", false),
    productionBranch: _.get(rootPkg, "monorepo.productionBranch", "master"),
    developBranch: _.get(rootPkg, "monorepo.developBranch", "master"),
    origin: _.get(rootPkg, "monorepo.origin", "origin"),
    registry: _.get(rootPkg, "publishConfig.registry", "https://registry.npmjs.org/"),
    registries: _.get(rootPkg, "monorepo.registries", []),
    repositoryUrl: _.get(rootPkg, "repository.url", _.get(rootPkg, "repository")),
    ignoreSyncDependencies: _.get(rootPkg, "monorepo.ignoreSyncDependencies", []),
    buildCmd: _.get(rootPkg, "monorepo.buildCmd", "build")
  };
}

export class MonoRepo {
  constructor(options = {}) {
    /**
     * @type {string}
     * @public
     */
    this.rootDir = options.rootDir || process.cwd();
    /**
     * @type {{dependencies: any, devDependencies: any, name: string, scripts: any}}
     * @public
     */
    this.rootPkg = options.rootPkg || readPackage(join(this.rootDir, "package.json"));
    /**
     * @type {any[]}
     * @public
     */
    this.dependencies = options.dependencies || getDependencies(join(this.rootDir, "package.json"));
    /**
     * @type {any}
     * @public
     */
    this.env = getEnv(this.rootPkg);

    const defaultOptions = getDefaultOptions(this.rootPkg);

    const {
      pkgMapper = defaultPackageMapper,
      productionBranch = this.env.PRODUCTION_BRANCH,
      developBranch = this.env.DEVELOP_BRANCH,
      origin = this.env.ORIGIN,
      registry = this.env.REGISTRY_URL,
      repositoryUrl = this.env.REPOSITORY_URL,
      ghToken = this.env.GH_TOKEN,
      branchName = this.env.BRANCH_NAME,
      verbose,
      npmAccess,
      npmDistTag,
      skipNpmPublish,
      registries,
      version,
      outputDir,
      workspaces,
      ignoreSyncDependencies,
      buildCmd,
      silent = false,
      dryRun = false,
      branch,
      nextRelease
    } = options;
    /**
     * @type {{name: string}}
     */
    this.branch = branch || {name: branchName};
    /**
     * @type {string}
     */
    this.nextRelease = nextRelease;
    /**
     * @type {string}
     * @public
     */
    this.ghToken = ghToken;
    /**
     * @type {string[]}
     * @public
     */
    this.workspaces = getWorkspaces(workspaces, this.rootPkg);
    /**
     * @type {string}
     * @public
     */
    this.version = version || _.get(this.rootPkg, "version");
    /**
     * @type {string}
     * @public
     */
    this.outputDir = outputDir || defaultOptions.outputDir;
    /**
     * @type {string}
     * @public
     */
    this.npmAccess = npmAccess || defaultOptions.npmAccess;
    /**
     * @type {string}
     * @public
     */
    this.npmDistTag = npmDistTag || defaultOptions.npmDistTag;
    /**
     * @type {boolean}
     * @public
     */
    this.skipNpmPublish = skipNpmPublish || defaultOptions.skipNpmPublish;
    /**
     * @type {string}
     * @public
     */
    this.productionBranch = productionBranch || defaultOptions.productionBranch;
    /**
     * @type {string}
     * @public
     */
    this.developBranch = developBranch || defaultOptions.developBranch;
    /**
     * @type {string}
     * @public
     */
    this.origin = origin || defaultOptions.origin;
    /**
     * @type {string}
     * @public
     */
    this.registry = registry || defaultOptions.registry;
    /**
     * @type {string[]}
     * @public
     */
    this.registries = registries || defaultOptions.registries;
    /**
     * @type {string}
     * @public
     */
    this.repositoryUrl = repositoryUrl || defaultOptions.repositoryUrl;
    /**
     * @type {string[]}
     * @public
     */
    this.ignoreSyncDependencies = ignoreSyncDependencies || defaultOptions.ignoreSyncDependencies;
    /**
     * @type {string}
     * @public
     */
    this.buildCmd = buildCmd || defaultOptions.buildCmd;
    this.pkgMapper = pkgMapper;
    /**
     * @type {Console}
     * @public
     */
    this.logger = options.logger || logger;
    /**
     * @type {boolean}
     * @public
     */
    this.verbose = verbose;
    /**
     * @type {string}
     * @public
     */
    this.branchName = branchName;
    /**
     * @type {boolean}
     * @public
     */
    this.silent = silent;
    /**
     * @type {boolean}
     * @public
     */
    this.dryRun = dryRun;

    // DOC
    this.ghpages = _.get(this.rootPkg, "monorepo.ghpages", []).map((item) => {
      return {
        ...item,
        dir: _.get(item, "dir", ""),
        url: _.get(item, "url", this.repositoryUrl),
        branch: _.get(item, "branch", "gh-pages"),
        cname: _.get(item, "cname", "")
      };
    });

    // EXAMPLES
    this.examples = {
      dir: _.get(this.rootPkg, "monorepo.examples.dir", "./examples"),
      repositories: _.get(this.rootPkg, "monorepo.examples.repositories", {}),
      ...(options.examples || {})
    };

    // HEROKU
    this.heroku = {
      /**
       * @type {string}
       * @public
       */
      app: this.env.HEROKU_APP || _.get(this.rootPkg, "monorepo.heroku.app", ""),
      /**
       * @type {string}
       * @public
       */
      apiKey: this.env.HEROKU_API_KEY || _.get(this.rootPkg, "monorepo.heroku.apiKey", ""),
      /**
       * @type {string}
       * @public
       */
      team: this.env.HEROKU_TEAM || _.get(this.rootPkg, "monorepo.heroku.team", ""),
      ...(options.heroku || {})
    };

    // DOCKER
    this.dockerhub = {
      /**
       * @type {string}
       * @public
       */
      repository: this.env.DOCKER_REPOSITORY || _.get(this.rootPkg, "monorepo.dockerhub.repository", ""),
      /**
       * @type {string}
       * @public
       */
      id: this.env.DOCKER_HUB_ID || _.get(this.rootPkg, "monorepo.dockerhub.id", ""),
      /**
       * @type {string}
       * @public
       */
      pwd: this.env.DOCKER_HUB_PWD || _.get(this.rootPkg, "monorepo.dockerhub.pwd", ""),
      ...(options.dockerhub || {})
    };
  }

  get cwd() {
    return this.rootDir;
  }

  get manager() {
    return this.hasYarn ? (this.hasYarnBerry ? yarnBerry : yarn) : npm;
  }

  get workspaceManager() {
    if (this.hasNx) {
      return nx;
    }

    if (this.hasLerna) {
      return lerna;
    }

    if (this.hasYarnBerry) {
      return yarnBerry;
    }

    if (this.hasYarn) {
      return yarn;
    }

    return npm;
  }

  get hasYarn() {
    return hasYarn(this.rootDir);
  }

  get hasWorkspaceManager() {
    return this.hasNx || this.hasLerna;
  }

  get hasYarnBerry() {
    return this.hasYarn && (this.rootPkg.packageManager || "").includes("yarn@");
  }

  get hasLerna() {
    return Boolean(_.get(this.rootPkg, "dependencies.lerna") || _.get(this.rootPkg, "devDependencies.lerna"));
  }

  get hasNx() {
    return Boolean(_.get(this.rootPkg, "dependencies.nx") || _.get(this.rootPkg, "devDependencies.nx"));
  }

  get hasBuild() {
    return Boolean(_.get(this.rootPkg, "scripts.build"));
  }

  get hasE2E() {
    return this.rootPkg.scripts["test:e2e"];
  }

  async clean(type, options = {}) {
    const newCtx = this.fork(options);

    switch (type) {
      case "workspace":
      case "workspaces":
        return cleanPackages(newCtx);
      case "docker":
        return cleanTagsDocker(newCtx);
    }

    throw new Error(`Unsupported clean type: ${type}. Supported types: workspace, docker`);
  }

  async build(type, options = {}) {
    const newCtx = this.fork(options);

    switch (type) {
      case "package":
        return buildHybridPackage(process.cwd(), null, newCtx);
      case "workspaces":
      case "workspace":
        return this.buildWorkspace();
      case "packages":
      default:
        return createTasksRunner(build(newCtx), newCtx);
    }
  }

  async buildWorkspace() {
    if (this.hasBuild) {
      await this.manager.run("build");
    }

    if (this.hasE2E) {
      await this.manager.run("test:e2e");
    }
  }

  async buildPackage() {
    if (this.hasBuild) {
      await this.manager.run("build");
    }

    if (this.hasE2E) {
      await this.manager.run("test:e2e");
    }
  }

  async configureWorkspace(options = {}) {
    return configureWorkspace(this.fork(options));
  }

  async newVersion(options) {
    return newVersion(this.fork(options));
  }

  async commitChanges(options) {
    return commitChanges(this.fork(options));
  }

  async sync(type, options = {}) {
    switch (type) {
      case "repository":
        return this.syncRepository(options);
      case "examples":
        return this.syncExamples(options);
      case "packages":
        return this.syncDependencies(options);
    }
    throw new Error(`Unsupported clean type: ${type}. Supported types: repository, examples, packages`);
  }

  async syncDependencies(options = {}) {
    return syncDependencies(this.fork(options));
  }

  async syncRepository(options = {}) {
    return syncRepository(this.fork(options));
  }

  async syncExamples(options = {}) {
    return syncExamples(this.fork(options));
  }

  publish(type, options = {}) {
    switch (type) {
      case "packages":
        return this.publishPackages(options);
      case "ghpages":
        return this.publishGhPages(options);
      case "heroku":
        return this.publishHeroku(options);
      case "docker":
        return this.publishDocker(options);
      case "examples":
        return this.publishExamples(options);
    }

    throw new Error(`Unsupported publish type: ${type}. Supported types: packages, ghpages, heroku, docker, examples`);
  }

  async publishPackages(options = {}) {
    if (this.skipNpmPublish) {
      this.logger.info("Publish packages skipped... (See skipNpmPublish option)");
      return;
    }

    return publishPackages(this.fork(options));
  }

  async publishGhPages(options = {}) {
    return publishGhPages(this.fork(options));
  }

  async publishExamples(options = {}) {
    return publishExamples(this.fork(options));
  }

  async publishDocker(options = {}) {
    return publishDocker(this.fork(options));
  }

  async publishHeroku(options = {}) {
    return publishHeroku(this.fork(options));
  }

  fork(options) {
    return new MonoRepo({
      ...this,
      ...options
    });
  }
}
