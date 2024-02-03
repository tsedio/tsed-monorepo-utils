#!/usr/bin/env node
const {program} = require("commander");

program
  .usage("monorepo version <version>")
  .arguments("<version>")
  .option("-v, --verbose", "Enable verbose log", (v, t) => t + 1, 0)
  .action(async (version) => {
    const {commands, runCommand} = await import("../src/index.js");
    runCommand(commands.VersionCmd, {
      version,
      verbose: !!program.opts().verbose
    });
  })
  .parse(process.argv);
