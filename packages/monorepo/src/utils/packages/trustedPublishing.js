import {npm} from "../cli/index.js";
import {join} from "path";
import {findPackages} from "./findPackages.js";
import {publishPackage} from "./publishPackages.js";
import {readPackage} from "./readPackage.js";
import {writePackage} from "./writePackage.js";

const BOOTSTRAP_VERSION = "0.0.1";

function isNpmRegistry(registry) {
  return registry?.includes("npmjs.org");
}

function getNpmRegistry(context) {
  return [context.registry, ...(context.registries || [])].find(isNpmRegistry);
}

function isNotFoundError(error) {
  return /\bE404\b|404 Not Found/.test([error.message, error.stdout, error.stderr].filter(Boolean).join("\n"));
}

function isAuthenticationError(error) {
  return /\bE401\b|\bEOTP\b|401 Unauthorized/.test([error.message, error.stdout, error.stderr].filter(Boolean).join("\n"));
}

function getGithubRepository(repositoryUrl) {
  const match = repositoryUrl?.match(/github\.com[/:]([^/]+\/[^/#]+?)(?:\.git)?$/);

  if (!match) {
    throw new Error("Unable to determine the GitHub repository. Pass --repo <owner/repository>.");
  }

  return match[1];
}

export async function getUnpublishedNpmPackages(context) {
  const registry = getNpmRegistry(context);

  if (!registry) {
    return [];
  }

  const packages = await findPackages(context);
  const unpublished = [];

  for (const pkg of packages.filter(({pkg}) => !pkg.private)) {
    try {
      npm.view(pkg.pkg.name, "version", "--registry", registry).get();
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }

      unpublished.push(pkg);
    }
  }

  return unpublished;
}

export async function getPublishedNpmPackages(context) {
  const registry = getNpmRegistry(context);

  if (!registry) {
    return [];
  }

  const packages = await findPackages(context);
  const published = [];

  for (const pkg of packages.filter(({pkg}) => !pkg.private)) {
    try {
      npm.view(pkg.pkg.name, "version", "--registry", registry).get();
      published.push(pkg);
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }
    }
  }

  return published;
}

export async function getNpmPackageTrustStatus(context) {
  const registry = getNpmRegistry(context);

  if (!registry) {
    return [];
  }

  const packages = await findPackages(context);
  const statuses = [];

  for (const pkg of packages) {
    if (pkg.pkg.private) {
      statuses.push({pkg, status: "private"});
      continue;
    }

    try {
      npm.view(pkg.pkg.name, "version", "--registry", registry).get();
    } catch (error) {
      if (isNotFoundError(error)) {
        statuses.push({pkg, status: "unpublished"});
        continue;
      }

      throw error;
    }

    try {
      statuses.push({pkg, status: (await getTrustedPublishers(pkg.pkg.name)).length ? "trusted" : "untrusted"});
    } catch (error) {
      if (!isAuthenticationError(error)) {
        throw error;
      }

      statuses.push({pkg, status: "authentication-required"});
    }
  }

  return statuses;
}

async function getTrustedPublishers(packageName) {
  const output = await npm.trust("list", packageName, "--json").getInteractive();
  const trustedPublishers = JSON.parse(output || "[]");

  if (Array.isArray(trustedPublishers)) {
    return trustedPublishers;
  }

  return trustedPublishers.trustedPublishers || [];
}

export async function bootstrapTrustedPackages(context) {
  if (!process.env.NPM_TOKEN) {
    throw new Error("NPM_TOKEN is required to bootstrap packages before configuring trusted publishing.");
  }

  const packages = await getUnpublishedNpmPackages(context);
  const repository = context.trustedPublishingRepository || getGithubRepository(context.repositoryUrl);
  const workflow = context.trustedPublishingWorkflow || "build.yml";
  const registry = getNpmRegistry(context);

  for (const pkg of packages) {
    const packagePath = join(pkg.distPath, "package.json");
    const packageJson = readPackage(packagePath);

    await writePackage(packagePath, {...packageJson, version: BOOTSTRAP_VERSION});

    try {
      await publishPackage(pkg.pkg, {cwd: pkg.distPath, url: registry}, {...context, trustedPublishing: false, registry});
      await npm.trust("github", pkg.pkg.name, "--repo", repository, "--file", workflow, "--allow-publish");
    } finally {
      await writePackage(packagePath, packageJson);
    }
  }

  return packages;
}

export async function migrateTrustedPackages(context) {
  const packages = await getPublishedNpmPackages(context);
  const repository = context.trustedPublishingRepository || getGithubRepository(context.repositoryUrl);
  const workflow = context.trustedPublishingWorkflow || "build.yml";
  const migrated = [];

  for (const pkg of packages) {
    if ((await getTrustedPublishers(pkg.pkg.name)).length) {
      context.logger?.info(`Trusted publisher already configured for ${pkg.pkg.name}; skipping.`);
      continue;
    }

    await npm.trust("github", pkg.pkg.name, "--repo", repository, "--file", workflow, "--allow-publish");
    migrated.push(pkg);
  }

  return migrated;
}

export async function assertNoUnpublishedNpmPackages(context) {
  const packages = await getUnpublishedNpmPackages(context);

  if (packages.length) {
    const names = packages.map(({pkg}) => pkg.name).join(", ");
    throw new Error(`Unpublished npm packages detected: ${names}. Run \"monorepo trust bootstrap\" locally before releasing.`);
  }
}
