export class CICmd {
  mapContext(commander) {
    return {
      type: commander.type
    };
  }

  getTasks(context) {
    return [
      {
        title: "Configure CI workspace",
        enabled: () => ["configure"].includes(context.type),
        task: () => context.configureWorkspace()
      }
    ];
  }
}
