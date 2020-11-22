export class SyncCmd {
  mapContext (commander) {
    return {
      type: commander.type,
      dryRun: commander.dryRun
    }
  }

  getTasks (context) {
    context.$mode = 'cli'
    return [
      {
        title: 'Sync dependencies from root package.json',
        enabled: () => ['packages'].includes(context.type),
        task: () => context.sync(context.type)
      },
      {
        title: `Sync repository`,
        enabled: () => ['repository'].includes(context.type),
        task: () => context.sync(context.type)
      },
      {
        title: 'Sync examples dependencies from root package.json',
        enabled: () => ['examples'].includes(context.type),
        task: () => context.sync(context.type)
      }
    ]
  }
}
