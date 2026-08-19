import chalk from "chalk";
import fs from "fs-extra";
import get from "lodash/get.js";
import {join} from "path";
import {npm} from "../cli/index.js";
import {findPackages} from "./findPackages.js";

function isLatestTagError(error) {
  return /Cannot implicitly apply the "latest" tag/.test([error.message, error.stdout, error.stderr].filter(Boolean).join("\n"));
}

function writeNpmrc(path, registries, scope, trustedPublishing) {
  const npmrc = join(path, ".npmrc");

  const content = registries.map((registry) => {
    registry = registry.replace("https:", "").replace("http:", "");

    let token = "NODE_AUTH_TOKEN";

    if (registry.includes("github")) {
      return scope + ":registry=https:" + registry + "\n" + registry + "/:_authToken=${GH_TOKEN}\n";
    }

    if (registry.includes("npmjs")) {
      if (trustedPublishing) {
        return "";
      }

      token = "NPM_TOKEN";
    }

    return registry + ":_authToken=${" + token + "}";
  });

  fs.writeFileSync(npmrc, content.join("\n"), {encoding: "utf8"});

  return npmrc;
}

export async function publishPackage(pkg, {url, cwd}, context, {tag} = {}) {
  const {npmAccess, dryRun, registry, trustedPublishing} = context;
  const npmrc = writeNpmrc(cwd, [url], pkg.name.split("/")[0], trustedPublishing);

  if (dryRun) {
    npm.pack().sync({
      cwd,
      env: {
        NPM_TOKEN: "test"
      }
    });
  } else {
    const args = ["--userconfig", npmrc, "--access", npmAccess, "--registry", registry];

    if (tag) {
      args.push("--tag", tag);
    }

    await npm.publish(...args).cwd(cwd);
  }
}

/**
 *
 * @param context {MonoRepo}
 * @returns {Promise<void>}
 */
export async function publishPackages(context) {
  const {logger, registry, registries} = context;

  const packages = await findPackages(context);

  const urls = [...new Set(registries.concat(registry).filter(Boolean))];
  const errors = [];
  const promises = packages
    .filter(({pkg}) => !pkg.private)
    .map(async ({distPath, pkg}) => {
      logger.info("Publish package", chalk.cyan(pkg.name));

      try {
        const cwd = distPath;
        const registries = get(pkg, "monorepo", urls);

        for (const url of registries) {
          try {
            logger.info("Publish package", chalk.cyan(pkg.name), "on", url);
            await publishPackage(pkg, {cwd, url}, context);
          } catch (er) {
            if (isLatestTagError(er)) {
              const tag = context.npmFallbackDistTag || "legacy";

              logger.info(`Publishing ${pkg.name} with the ${tag} tag because npm rejected latest.`);
              await publishPackage(pkg, {cwd, url}, context, {tag});
            } else {
              errors.push({pkg, error: er, registry});
              logger.error(chalk.red(er.message), chalk.red(er.stack));
            }
          }
        }
      } catch (er) {
        logger.error(chalk.red(er.message), chalk.red(er.stack));
        errors.push({pkg, error: er});
      }

      return undefined;
    });

  await Promise.all(promises);

  if (errors.length) {
    const message =
      "Some packages have not been published: \n" +
      errors
        .map(({pkg, error, registry}) => {
          return [pkg.name, registry, error.message].filter(Boolean).join(" - ");
        })
        .join("\n");

    logger.error(chalk.red(message));
    throw new Error(message);
  }
}
