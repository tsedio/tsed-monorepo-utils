#!/usr/bin/env node
const commander = require('commander')
const { commands, runCommand } = require('../src')

commander
  .usage('monorepo publish [options]')
  .option('-v, --verbose', 'Enable verbose log', (v, t) => t + 1, 0)
  .option('-d, --dry-run', 'Run publish in dryRun mode', (v, t) => t + 1, 0)
  .parse(process.argv)

runCommand(commands.PublishCmd, commander)
