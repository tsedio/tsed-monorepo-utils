export class SyncCmd {
  getTasks (context) {
    return [
      {
        title: 'Sync dependencies from root package.json',
        enabled: () => ['packages', 'all'].includes(context.type),
        task: () => context.syncDependencies()
      },
      {
        title: `Sync repository`,
        enabled: () => ['repository', 'all'].includes(context.type),
        task: () => context.syncRepository()
      },
      {
        title: 'Sync examples dependencies from root package.json',
        enabled: () => ['examples', 'all'].includes(context.type),
        task: () => context.syncExamplesDependencies()
      }
    ]
  }
}
