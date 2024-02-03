#!/usr/bin/env node
const {program} = require("commander");

program
  .usage("monorepo publish <type> [options]")
  .arguments("<type>")
  .option("-v, --verbose", "Enable verbose log", (v, t) => t + 1, 0)
  .option("-d, --dry-run", "Run publish in dryRun mode", (v, t) => t + 1, 0)
  .action(async (type) => {
    const {commands, runCommand} = await import("../src/index.js");
    const options = program.opts();

    runCommand(commands.PublishCmd, {
      type,
      verbose: !!options.verbose,
      dryRun: !!options.dryRun
    });
  })
  .parse(process.argv);
