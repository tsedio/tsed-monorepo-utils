const execa = require("execa");
const logger = require("fancy-log");
const chalk = require("chalk");
const {dirname, join} = require("path");
const {findPackages} = require("./findPackages");
const hasLerna = () => {
  try {
    require.resolve("lerna");
    return true;
  } catch (er) {
    return false;
  }
};

exports.compilePackages = async (options) => {
  const {
    rootDir,
    packagesDir,
    buildCmd = "build"
  } = options;
  let child;

  if (hasLerna()) {
    const child = execa("lerna", ["run", buildCmd, "--stream"], {
      cwd: rootDir
    });
    child.stdout.on("data", data => {
      data
        .toString()
        .split("\n")
        .filter(line => !!line.trim())
        .map((line) => {
          logger.info(line);
        });
    });
    child.stderr.on("data", data => {
      data
        .toString()
        .split("\n")
        .filter(line => !!line.trim())
        .map((line) => {
          logger.error(line);
        });
    });
  } else {
    const pkgs = await findPackages({
      cwd: join(rootDir, packagesDir)
    });

    for (const {path, name, pkg} of pkgs) {
      const cwd = dirname(path);

      const child = execa("npm", ["run", buildCmd], {
        cwd
      });

      child.stdout.on("data", data => {
        data
          .toString()
          .split("\n")
          .filter(line => !!line.trim())
          .map((line) => {
            logger.info(chalk.magenta(pkg.name), line.replace(/^ > /, ""));
          });
      });
      child.stderr.on("data", data => {
        data
          .toString()
          .split("\n")
          .filter(line => !!line.trim())
          .map((line) => {
            logger.error(chalk.red(pkg.name), line.replace(/^ > /, ""));
          });
      });

      await child;
    }
  }

};
