#!/usr/bin/env node
const {program} = require("commander");

program
  .usage("monorepo packages <type> [options]")
  .arguments("<type>")
  .option("-v, --verbose", "Enable verbose log", (v, t) => t + 1, 0)
  .action(async (type) => {
    const {commands, runCommand} = await import("../src/index.js");
    const options = program.opts();

    runCommand(commands.PackagesCmd, {
      type,
      verbose: !!options.verbose
    });
  })
  .parse(process.argv);
