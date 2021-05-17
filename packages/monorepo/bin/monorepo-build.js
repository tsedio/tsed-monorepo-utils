#!/usr/bin/env node
const commander = require('commander')
const { commands, runCommand } = require('../src')

commander
  .usage('monorepo build [options]')
  .option('-v, --verbose', 'Enable verbose log', (v, t) => t + 1, 0)
  .parse(process.argv)

runCommand(commands.BuildCmd, commander.opts())
