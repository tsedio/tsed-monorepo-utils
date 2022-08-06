import {Cli} from "./Cli.js";

class NxCli extends Cli {
  constructor() {
    super("nx");
  }

  run(cmd, ...args) {
    return super.run(cmd, ...args);
  }

  async runMany(cmd, args = [], context) {
    const {logger} = context;
    const child = super.run("run-many", `--target=${cmd}`, "--all", ...args).toStream();

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
    return super.run("install", ...args);
  }
}

export const nx = new NxCli();
