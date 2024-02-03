#!/usr/bin/env node
const commander = require("commander");

commander
  .usage("monorepo ci <type> [options]")
  .arguments("<type>")
  .option("-v, --verbose", "Enable verbose log", (v, t) => t + 1, 0)
  .action(async (type) => {
    const {commands, runCommand} = await import("../src/index.js");

    runCommand(commands.CICmd, {
      type,
      verbose: !!commander.opts().verbose
    });
  })
  .parse(process.argv);
