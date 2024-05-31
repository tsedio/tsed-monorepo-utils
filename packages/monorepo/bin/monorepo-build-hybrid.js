#!/usr/bin/env node
const {program} = require("commander");

program
  .usage("monorepo build-hybrid [options]")
  .option("-v, --verbose", "Enable verbose log", (v, t) => t + 1, 0)
  .parse(process.argv);

(async () => {
  const {commands, runCommand} = await import("../src/index.js");

  runCommand(commands.BuildHybridCmd, program.opts());
})();
