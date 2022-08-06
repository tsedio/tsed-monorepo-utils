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

  runMany(cmd, ...args) {
    return super.run("run", cmd, "--stream", ...args);
  }
}

export const lerna = new LernaCli();
