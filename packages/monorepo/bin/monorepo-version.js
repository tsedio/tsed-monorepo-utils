#!/usr/bin/env node
const commander = require('commander')
const { commands, runCommand } = require('../src')

commander
  .usage('monorepo version <version>')
  .arguments('<version>')
  .option('-v, --verbose', 'Enable verbose log', (v, t) => t + 1, 0)
  .action((version) => {
    runCommand(commands.VersionCmd, {
      version,
      verbose: !!commander.verbose
    })
  })
  .parse(process.argv)


