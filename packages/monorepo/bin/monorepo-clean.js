#!/usr/bin/env node
const commander = require('commander')
const { commands, runCommand } = require('../src')

commander
  .usage('monorepo clean <type> [options]')
  .option('-v, --verbose', 'Enable verbose log', (v, t) => t + 1, 0)
  .action((type) => {
    runCommand(commands.ClienCmd, {
      type,
      verbose: !!commander.verbose
    })
  })
  .parse(process.argv)

runCommand(commands.BuildCmd, commander)
