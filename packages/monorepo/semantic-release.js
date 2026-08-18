import {MonoRepo} from "./src/index.js";
import {execFileSync} from "node:child_process";

/**
 * @type {MonoRepo}
 */
let monoRepo;

export async function verifyConditions(pluginConfig = {}, context) {
  monoRepo = new MonoRepo({
    rootDir: context.cwd,
    trustedPublishing: pluginConfig.trustedPublishing
  });

  await monoRepo.configureWorkspace({
    dryRun: pluginConfig.dryRun
  });
}

export async function prepare(pluginConfig, context) {
  const token = process.env.NPM_TOKEN;

  if (token) {
    const registry = [...new Set([...(monoRepo.registries || []), monoRepo.registry].filter(Boolean))].find((url) =>
      url.includes("npmjs")
    );

    if (registry) {
      try {
        execFileSync("npm", ["whoami", "--registry", registry], {
          env: {
            ...process.env,
            NODE_AUTH_TOKEN: token,
            NPM_CONFIG_USERCONFIG: process.env.NPM_CONFIG_USERCONFIG || "/dev/null"
          },
          stdio: "pipe"
        });
      } catch (error) {
        const details = [error?.stdout?.toString(), error?.stderr?.toString()].filter(Boolean).join("\n").trim();
        throw new Error(
          `[semantic-release:prepare] NPM token invalid or expired for registry ${registry}.${details ? `\n${details}` : ""}`
        );
      }
    }
  }

  const {
    nextRelease: {version}
  } = context;

  await monoRepo.newVersion({version});
  await monoRepo.build("workspace");
  await monoRepo.manager.refreshInstall();
  await monoRepo.commitChanges({version});
}

export async function publish(pluginConfig) {
  return monoRepo.publish("packages", {dryRun: pluginConfig.dryRun});
}

export async function success(pluginConfig) {
  if (!pluginConfig.dryRun) {
    return monoRepo.sync("repository");
  }
}
