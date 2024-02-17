import {Cli} from "./Cli.js";

class NpmCli extends Cli {
  constructor() {
    super("npm");
  }

  newVersion(version) {
    return this.version("--no-git-tag-version", version);
  }

  version(...args) {
    return this.sync("version", ...args);
  }

  run(cmd, ...args) {
    return super.run("run", cmd, ...args);
  }

  async runMany(cmd, args = [], context) {
    const {logger} = context;
    const child = super.run("run", "test", "--workspaces", ...args).toStream();

    return await this.handleStream(child, {
      success(line) {
        logger.info(line);
      },
      error(line) {
        logger.error(line);
      }
    });
  }

  publish(...args) {
    return super.run("publish", ...args);
  }

  pack(...args) {
    return super.run("pack", ...args);
  }

  install(...args) {
    return super.run("install", ...args);
  }
  refreshInstall() {
    return this.install();
  }

  /**
   * Reinstall dependencies without package-lock mutation
   * @returns {Promise<unknown>}
   */
  restore() {
    return super.run("install", "--no-package-lock", "--no-production");
  }
}

export const npm = new NpmCli();
