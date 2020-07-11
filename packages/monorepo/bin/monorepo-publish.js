#!/usr/bin/env node
const commander = require('commander')
const { commands, runCommand } = require('../src')

commander
  .usage('monorepo publish <type> [options]')
  .arguments('<type>')
  .option('-v, --verbose', 'Enable verbose log', (v, t) => t + 1, 0)
  .option('-d, --dry-run', 'Run publish in dryRun mode', (v, t) => t + 1, 0)
  .action((type) => {
    runCommand(commands.PublishCmd, {
      type,
      verbose: !!commander.verbose,
      dryRun: !!commander.dryRun
    })
  })
  .parse(process.argv)

