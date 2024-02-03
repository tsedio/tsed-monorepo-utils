#!/usr/bin/env node
const commander = require("commander");
const {runCommand, commands} = require("../src/index.js");

commander
  .usage("monorepo build [options]")
  .option("-v, --verbose", "Enable verbose log", (v, t) => t + 1, 0)
  .parse(process.argv);

(() => {
  const {commands, runCommand} = import("../src");

  runCommand(commands.BuildCmd, commander.opts());
})();
