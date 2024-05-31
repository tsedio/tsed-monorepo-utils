#!/usr/bin/env node

const {program} = require("commander");
const cliPkg = require("../package.json");

program
  .version(cliPkg.version)
  .command("ci <type>", "Perform ci actions (configure)")
  .command("build <type>", "Build artifacts (workspace, packages)")
  .command("build-hybrid <type>", "Build hybrid esm/cjs package (must be run over a single package)")
  .command("clean <type>", "Clean artifacts (workspace, docker)")
  .command("publish <type>", "Publish artifacts (packages, examples, ghpages, docker, heroku)")
  .command("sync <type>", "Perform synchronisation on given type (repository, packages, examples)")
  .command("version <version>", "Update packages version")
  .parse(process.argv);
