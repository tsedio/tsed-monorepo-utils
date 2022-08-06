import {Cli} from "./Cli.js";

class LernaCli extends Cli {
  constructor() {
    super("lerna");
  }

  newVersion(version) {
    return this.version(version, "--exact", "--yes", "--no-git-tag-version", "--no-push");
  }

  version(...args) {
    return this.sync("version", ...args);
  }

  run(cmd, ...args) {
    return super.run("run", cmd, "--stream", ...args);
  }

  async runMany(cmd, args = [], context) {
    const {logger} = context;
    const child = super.run("run", cmd, "--stream", ...args).toStream();

    return await this.handleStream(child, {
      success(line) {
        logger.info(line);
      },
      error(line) {
        logger.error(line);
      }
    });
  }
}

export const lerna = new LernaCli();
