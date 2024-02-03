#!/usr/bin/env node
const commander = require("commander");

commander
  .usage("monorepo build [options]")
  .option("-v, --verbose", "Enable verbose log", (v, t) => t + 1, 0)
  .parse(process.argv);

(async () => {
  const {commands, runCommand} = await import("../src/index.js");

  runCommand(commands.BuildCmd, commander.opts());
})();
