export class SyncCmd {
  getTasks (context) {
    return [
      {
        title: 'Sync dependencies from root package.json',
        enable: () => context.type === 'packages',
        task: () => context.syncDependencies()
      },
      {
        title: `Sync repository`,
        enable: () => context.type === 'repository',
        task: () => context.syncRepository()
      }
    ]
  }
}
