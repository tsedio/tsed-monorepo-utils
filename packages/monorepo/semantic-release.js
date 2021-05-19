const {MonoRepo} = require("./src");

let monoRepo;

module.exports = {
  async verifyConditions(pluginConfig, context) {
    monoRepo = new MonoRepo({
      rootDir: context.cwd
    });

    await monoRepo.configureWorkspace({
      dryRun: pluginConfig.dryRun
    });
  },

  async prepare(pluginConfig, context) {
    const {
      nextRelease: {version}
    } = context;

    await monoRepo.newVersion({version});
    await monoRepo.build("workspace");
    await monoRepo.commitChanges({version});
  },

  async publish(pluginConfig) {
    return monoRepo.publish("packages", {dryRun: pluginConfig.dryRun});
  },

  async success(pluginConfig) {
    if (!pluginConfig.dryRun) {
      return monoRepo.sync("repository");
    }
  }
};
