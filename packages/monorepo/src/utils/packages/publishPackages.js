import chalk from "chalk";
import fs from "fs-extra";
import get from "lodash/get.js";
import {join} from "path";
import {npm} from "../cli/index.js";
import {findPackages} from "./findPackages.js";

const DEFAULT_CONCURRENCY = 8;
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 5000;

// Errors worth retrying: Sigstore transparency log conflicts/timeouts (provenance),
// npm rate limiting, registry 5xx and network failures.
const TRANSIENT_ERROR = /TLOG_CREATE_ENTRY_ERROR|E429|E5\d\d|ETIMEDOUT|ECONNRESET|ECONNREFUSED|EAI_AGAIN|socket hang up|network timeout/i;

function errorOutput(error) {
  return [error.message, error.stdout, error.stderr].filter(Boolean).join("\n");
}

function isLatestTagError(error) {
  return /Cannot implicitly apply the "latest" tag/.test(errorOutput(error));
}

function isTransientError(error) {
  return TRANSIENT_ERROR.test(errorOutput(error));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

/**
 * Tell if the package version already exists on the registry, so a release can be replayed safely.
 */
export async function isPublished(pkg, {url, cwd}, context) {
  if (!pkg.version) {
    return false;
  }

  try {
    const result = await npm
      .view(`${pkg.name}@${pkg.version}`, "version", "--registry", url || context.registry)
      .toStream({cwd, reject: false});

    return String(result?.stdout || "").trim() === pkg.version;
  } catch {
    return false;
  }
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

    await npm
      .publish(...args)
      .cwd(cwd)
      .capture();
  }
}

async function publishOnRegistry(pkg, {cwd, url}, context) {
  const {logger, dryRun} = context;
  const retries = context.npmPublishRetries ?? DEFAULT_RETRIES;
  const retryDelay = context.npmPublishRetryDelay ?? DEFAULT_RETRY_DELAY;
  let tag;

  if (!dryRun && (await isPublished(pkg, {cwd, url}, context))) {
    logger.info("Skip package", chalk.cyan(`${pkg.name}@${pkg.version}`), "already published on", url);
    return;
  }

  for (let attempt = 0; ; attempt++) {
    try {
      logger.info("Publish package", chalk.cyan(pkg.name), "on", url);
      await publishPackage(pkg, {cwd, url}, context, {tag});
      return;
    } catch (er) {
      if (!tag && isLatestTagError(er)) {
        tag = context.npmFallbackDistTag || "latest";
        logger.info(`Retrying ${pkg.name} with an explicit ${tag} tag because npm rejected the implicit latest tag.`);
        continue;
      }

      if (attempt >= retries || !isTransientError(er)) {
        throw er;
      }

      // The failed attempt may still have reached the registry.
      if (await isPublished(pkg, {cwd, url}, context)) {
        logger.info("Package", chalk.cyan(`${pkg.name}@${pkg.version}`), "was published despite the error");
        return;
      }

      const delay = retryDelay * (attempt + 1);
      logger.info(`Retrying ${pkg.name} in ${delay}ms after a transient error (${attempt + 1}/${retries}).`);
      await wait(delay);
    }
  }
}

async function runWithConcurrency(items, concurrency, fn) {
  const queue = [...items];
  const workers = Array.from({length: Math.max(1, Math.min(concurrency, queue.length))}, async () => {
    while (queue.length) {
      await fn(queue.shift());
    }
  });

  await Promise.all(workers);
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
  const concurrency = context.npmPublishConcurrency || DEFAULT_CONCURRENCY;

  await runWithConcurrency(
    packages.filter(({pkg}) => !pkg.private),
    concurrency,
    async ({distPath, pkg}) => {
      const registries = get(pkg, "monorepo", urls);

      for (const url of registries) {
        try {
          await publishOnRegistry(pkg, {cwd: distPath, url}, context);
        } catch (er) {
          errors.push({pkg, error: er, registry: url});
          logger.error(chalk.red(er.message), chalk.red(er.stack));
        }
      }
    }
  );

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
