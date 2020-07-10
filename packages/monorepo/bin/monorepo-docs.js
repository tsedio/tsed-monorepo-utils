#!/usr/bin/env node
const commander = require('commander')
const { commands, runCommand } = require('../src')

commander
  .usage('monorepo docs <action>')
  .arguments('<action>')
  .option('-v, --verbose', 'Enable verbose log', (v, t) => t + 1, 0)
  .action((action) => {
    runCommand(commands.DocsCmd, {
      action,
      verbose: !!commander.verbose
    })
  })
  .parse(process.argv)


