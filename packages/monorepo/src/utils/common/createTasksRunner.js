import Listr from "listr";

export function createTasksRunner(tasks, context) {
  const list = new Listr(tasks, {
    concurrent: !!context.concurrent,
    renderer: !context.verbose && !context.env.CI ? "default" : "verbose"
  });

  if (context.run === false) {
    return list;
  }

  return list.run(context);
}
