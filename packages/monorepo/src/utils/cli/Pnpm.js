import {Cli} from "./Cli.js";

class PnpmCli extends Cli {
  constructor() {
    super("pnpm");
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
   * Reinstall dependencies without lockfile mutation and including dev deps
   */
  restore() {
    return super.run("install", "--frozen-lockfile", "--prod=false");
  }
}

export const pnpm = new PnpmCli();
