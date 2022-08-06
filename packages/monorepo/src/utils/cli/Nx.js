import {Cli} from "./Cli.js";

class NxCli extends Cli {
  constructor() {
    super("nx");
  }

  run(cmd, ...args) {
    return super.run(cmd, ...args);
  }

  runMany(cmd, ...args) {
    return super.run("run-many", `--target=${cmd}`, "--all", ...args);
  }

  install(...args) {
    return super.run("install", ...args);
  }
}

export const nx = new NxCli();
