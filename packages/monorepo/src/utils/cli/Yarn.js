import {Cli} from "./Cli.js";

class YarnCli extends Cli {
  constructor() {
    super("yarn");
  }

  version(...args) {
    return this.sync("version", ...args);
  }

  run(...args) {
    return super.run(...args);
  }

  install(...args) {
    return super.run("install", ...args);
  }
  refreshInstall() {
    return this.install();
  }

  /**
   * Reinstall dependencies without yarn.lock mutation
   * @returns {Promise<unknown>}
   */
  restore() {
    return super.run("install", "--frozen-lockfile", "--production=false");
  }
}

export const yarn = new YarnCli();
