import {Cli} from "./Cli.js";
import {bumpPackagesVersion} from "../packages/bumpPackagesVersion.js";

class YarnBerryCli extends Cli {
  constructor() {
    super("yarn");
  }

  newVersion(version, context) {
    return bumpPackagesVersion(version, context);
  }

  version(...args) {
    return this.sync("version", ...args);
  }

  run(...args) {
    return super.run("run", ...args);
  }

  async runMany(cmd, args = [], context) {
    const {logger} = context;
    const child = super.run("workspaces", "foreach", "run", cmd, ...args).toStream();

    return await this.handleStream(child, {
      success(line) {
        logger.info(line);
      },
      error(line) {
        logger.error(line);
      }
    });
  }

  install(...args) {
    return super.run(args.length ? "add" : "install", ...args);
  }

  /**
   * Reinstall dependencies without yarn.lock mutation
   * @returns {Promise<unknown>}
   */
  restore() {
    return super.run("install", "--immutable");
  }
}

export const yarnBerry = new YarnBerryCli();
