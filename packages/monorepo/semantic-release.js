import {MonoRepo} from "./src/index.js";

/**
 * @type {MonoRepo}
 */
let monoRepo;

export async function verifyConditions(pluginConfig, context) {
  monoRepo = new MonoRepo({
    rootDir: context.cwd
  });

  await monoRepo.configureWorkspace({
    dryRun: pluginConfig.dryRun
  });
}

export async function prepare(pluginConfig, context) {
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
