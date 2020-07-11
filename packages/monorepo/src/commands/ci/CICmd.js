export class CICmd {
  getTasks (context) {
    return [
      {
        title: 'Install CI workspace',
        enabled: context.type === 'install',
        task: () => context.configureWorkspace()
      }
    ]
  }
}
