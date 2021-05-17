#!/usr/bin/env node
const commander = require('commander')
const { commands, runCommand } = require('../src')

commander
  .usage('monorepo clean <type> [options]')
  .arguments('<type>')
  .option('-v, --verbose', 'Enable verbose log', (v, t) => t + 1, 0)
  .action((type) => {
    runCommand(commands.CleanCmd, {
      type,
      verbose: !!commander.opts().verbose
    })
  })
  .parse(process.argv)
