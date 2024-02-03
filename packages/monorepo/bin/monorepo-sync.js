#!/usr/bin/env node
const commander = require("commander");

commander
  .usage("monorepo sync <type> [options]")
  .arguments("<type>")
  .option("-v, --verbose", "Enable verbose log", (v, t) => t + 1, 0)
  .action(async (type) => {
    const {commands, runCommand} = await require("../src/index.js");

    const options = commander.opts();

    runCommand(commands.SyncCmd, {
      type,
      verbose: !!options.verbose
    });
  })
  .parse(process.argv);
