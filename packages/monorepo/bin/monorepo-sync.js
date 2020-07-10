#!/usr/bin/env node
const commander = require('commander')
const { commands, runCommand } = require('../src')

commander
  .usage('monorepo sync <type> [options]')
  .arguments('<type>')
  .option('-v, --verbose', 'Enable verbose log', (v, t) => t + 1, 0)
  .action((type) => {
    runCommand(commands.SyncCmd, {
      type,
      verbose: !!commander.verbose
    })
  })
  .parse(process.argv)
