export class ExamplesCmd {
  getTasks (context) {
    return [
      {
        title: 'Sync examples dependencies from root package.json',
        enabled: () => ['sync'].includes(context.type),
        task: () => context.syncExamplesDependencies()
      },
      {
        title: 'Publish examples',
        enabled: () => ['publish'].includes(context.type),
        task: () => context.publishExamples()
      },
    ]
  }
}
