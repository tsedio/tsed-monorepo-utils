#!/usr/bin/env node
const {program} = require("commander");

program
  .usage("monorepo ci <type> [options]")
  .arguments("<type>")
  .option("-v, --verbose", "Enable verbose log", (v, t) => t + 1, 0)
  .action(async (type) => {
    const {commands, runCommand} = await import("../src/index.js");

    runCommand(commands.CICmd, {
      type,
      verbose: !!program.opts().verbose
    });
  })
  .parse(process.argv);
