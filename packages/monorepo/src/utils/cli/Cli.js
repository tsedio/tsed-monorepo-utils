import "any-observable/register/rxjs-all";
import execa from "execa";
import streamToObservable from "@samverschueren/stream-to-observable";
import {filter, merge} from "rxjs/operators";
import split from "split";
import {spawnSync} from "child_process";
import {findPackages} from "../packages/findPackages.js";
import {dirname} from "path";
import get from "lodash/get.js";
import chalk from "chalk";

export class Cli {
  constructor(cmd) {
    this.cmd = cmd;
  }

  sync(...args) {
    return Cli.run(this.cmd, args).sync();
  }

  run(...args) {
    return Cli.run(this.cmd, args);
  }

  get(...args) {
    return Cli.run(this.cmd, args).get();
  }

  /**
   * @param cmd string
   * @param args {any[]}
   * @param context {MonoRepo}
   * @returns {Promise<void>}
   */
  async runMany(cmd, args = [], context) {
    const {logger} = context;
    const pkgs = await findPackages(context);

    for (const {path, pkg} of pkgs) {
      const cwd = dirname(path);

      if (get(pkg, `scripts.${cmd}`)) {
        const child = this.run(cmd, ...args).sync({
          cwd
        });

        await this.handleStream(child, {
          success(line) {
            logger.info(chalk.magenta(pkg.name), line.replace(/^ > /, ""));
          },
          error(line) {
            logger.error(chalk.red(pkg.name), line.replace(/^ > /, ""));
          }
        });
      }
    }
  }

  handleStream(child, {success, error}) {
    child.stdout.on("data", (data) => {
      data
        .toString()
        .split("\n")
        .filter((line) => !!line.trim())
        .map(success);
    });
    child.stderr.on("data", (data) => {
      data
        .toString()
        .split("\n")
        .filter((line) => !!line.trim())
        .map(error);
    });

    return child;
  }

  static run(cmd, args = [], options = {}) {
    const run = (opt = {}) => {
      return execa(cmd, args, {
        cwd: process.cwd(),
        ...opt,
        ...options
      });
    };

    let isPromise = true;

    const promise = new Promise((resolve, reject) => {
      setTimeout(async () => {
        if (isPromise) {
          try {
            const result = await run({
              stdio: "inherit"
            });

            resolve(result);
          } catch (err) {
            // eslint-disable-next-line no-console
            reject(err);
          }
        } else {
          resolve();
        }
      }, 10);
    });

    promise.toObservable = (opt) => {
      isPromise = false;
      const cp = run(opt);
      const stdout = streamToObservable(cp.stdout.pipe(split()), {await: cp});
      const stderr = streamToObservable(cp.stderr.pipe(split()), {await: cp});

      return stdout.pipe(merge(stderr)).pipe(filter(Boolean));
    };

    promise.toStream = (opt) => {
      isPromise = false;

      return run(opt);
    };

    promise.cwd = (cwd) => {
      options.cwd = cwd;
      return promise;
    };

    promise.sync = (opt) => {
      isPromise = false;

      return execa.sync(cmd, args, {
        cwd: process.cwd(),
        stdio: "inherit",
        ...options,
        ...opt
      });
    };

    promise.getRaw = (opt) => {
      isPromise = false;
      return Cli.getRaw(cmd, args, {
        cwd: process.cwd(),
        ...options,
        ...opt
      });
    };

    promise.get = () => {
      isPromise = false;

      return execa.sync(cmd, args, {
        cwd: process.cwd()
      }).stdout;
    };

    return promise;
  }

  static getRaw(cmd, args, options) {
    return spawnSync(cmd, args, options)
      .output.filter((o) => !!o)
      .map((o) => o.toString())
      .join("\n")
      .trim();
  }
}
