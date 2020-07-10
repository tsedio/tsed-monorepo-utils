#!/usr/bin/env node
const commander = require('commander')
const { commands, runCommand } = require('../src')

commander
  .usage('monorepo examples <actions> [options]')
  .arguments('<actions>')
  .option('-v, --verbose', 'Enable verbose log', (v, t) => t + 1, 0)
  .action((type) => {
    runCommand(commands.ExamplesCmd, {
      type,
      verbose: !!commander.verbose
    })
  })
  .parse(process.argv)
