#!/usr/bin/env node
const {program} = require("commander");

program
  .usage("monorepo trust <type> [options]")
  .arguments("<type>")
  .option("-r, --repository <owner/repository>", "GitHub repository allowed to publish")
  .option("-f, --file <workflow>", "GitHub Actions workflow filename")
  .option("-y, --yes", "Skip npm trust confirmation prompts")
  .option("-v, --verbose", "Enable verbose log", (v, t) => t + 1, 0)
  .action(async (type) => {
    const {commands, runCommand} = await import("../src/index.js");
    const options = program.opts();

    runCommand(commands.TrustCmd, {
      type,
      repository: options.repository,
      file: options.file,
      yes: !!options.yes,
      verbose: !!options.verbose
    });
  })
  .parse(process.argv);
