#!/usr/bin/env node

const commander = require('commander')
const cliPkg = require('../../../package.json')

commander
  .version(cliPkg.version)
  .command('build', 'Build packages')
  .command('publish', 'Publish packages')
  .command('publish', 'Publish packages')
  .parse(process.argv)
