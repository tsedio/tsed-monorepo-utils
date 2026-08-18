import {npm} from "../cli/index.js";
import {findPackages} from "./findPackages.js";
import {publishPackage} from "./publishPackages.js";

function isNpmRegistry(registry) {
  return registry?.includes("npmjs.org");
}

function getNpmRegistry(context) {
  return [context.registry, ...(context.registries || [])].find(isNpmRegistry);
}

function isNotFoundError(error) {
  return /\bE404\b|404 Not Found/.test([error.message, error.stdout, error.stderr].filter(Boolean).join("\n"));
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

export async function bootstrapTrustedPackages(context) {
  if (!process.env.NPM_TOKEN) {
    throw new Error("NPM_TOKEN is required to bootstrap packages before configuring trusted publishing.");
  }

  const packages = await getUnpublishedNpmPackages(context);
  const repository = context.trustedPublishingRepository || getGithubRepository(context.repositoryUrl);
  const workflow = context.trustedPublishingWorkflow || "build.yml";
  const registry = getNpmRegistry(context);

  for (const pkg of packages) {
    await publishPackage(pkg.pkg, {cwd: pkg.distPath, url: registry}, {...context, trustedPublishing: false, registry});
    await npm.trust("github", pkg.pkg.name, "--repo", repository, "--file", workflow, "--allow-publish");
  }

  return packages;
}

export async function assertNoUnpublishedNpmPackages(context) {
  const packages = await getUnpublishedNpmPackages(context);

  if (packages.length) {
    const names = packages.map(({pkg}) => pkg.name).join(", ");
    throw new Error(`Unpublished npm packages detected: ${names}. Run \"monorepo trust bootstrap\" locally before releasing.`);
  }
}
