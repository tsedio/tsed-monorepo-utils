export class PublishCmd {
  mapContext (commander) {
    return {
      dryRun: commander.dryRun
    }
  }

  getTasks (context) {
    return [
      {
        title: 'Configure workspace',
        task: () => context.configureWorkspace()
      },
      {
        title: 'Commit changes',
        task: () => context.commitChanges()
      },
      {
        title: `Publish packages ${context.dryRun ? '(DryRun)' : ''}`,
        task: () => context.publish()
      },
      {
        title: `Sync repository ${context.dryRun ? '(DryRun)' : ''}`,
        skip: () => context.dryRun,
        task: () => context.syncRepository()
      }
    ]
  }
}
