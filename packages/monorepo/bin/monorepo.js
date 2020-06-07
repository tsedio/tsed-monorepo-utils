#!/usr/bin/env node

const commander = require('commander')
const cliPkg = require('../package.json')

commander
  .version(cliPkg.version)
  .command('build', 'Build packages')
  .command('version', 'Update packages version')
  .command('publish', 'Publish packages')
  .parse(process.argv)
