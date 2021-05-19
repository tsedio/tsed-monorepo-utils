export class PublishCmd {
  mapContext(commander) {
    return {
      type: commander.type,
      dryRun: commander.dryRun
    };
  }

  getTasks(context) {
    return [
      {
        title: "Configure workspace",
        enabled: () => context.env.CI,
        task: () => context.configureWorkspace()
      },

      {
        title: "Commit changes",
        enabled: () => ["packages"].includes(context.type),
        task: () => context.commitChanges()
      },
      {
        title: `Publish packages on NPM ${context.dryRun ? "(DryRun)" : ""}`,
        enabled: () => ["packages"].includes(context.type),
        task: () => context.publish(context.type, context)
      },
      {
        title: "Publish on DockerHub",
        enabled: () => ["docker"].includes(context.type),
        skip: () => context.dryRun,
        task: () => context.publish(context.type, context)
      },
      {
        title: "Publish on Heroku",
        enabled: () => ["heroku"].includes(context.type),
        skip: () => context.dryRun,
        task: () => context.publish(context.type)
      },
      {
        title: "Publish examples",
        enabled: () => ["examples"].includes(context.type),
        skip: () => context.dryRun,
        task: () => context.publish(context.type)
      },
      {
        title: "Publish documentation on GithubPages",
        enabled: () => ["ghpages"].includes(context.type),
        skip: () => context.dryRun,
        task: () => context.publish(context.type)
      },
      {
        title: `Sync repository ${context.dryRun ? "(DryRun)" : ""}`,
        enabled: () => ["packages"].includes(context.type),
        skip: () => context.dryRun,
        task: () => context.syncRepository()
      }
    ];
  }
}
