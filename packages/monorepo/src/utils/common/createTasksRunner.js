import Listr from 'listr'

export function createTasksRunner (tasks, context) {
  return new Listr(tasks, {
    concurrent: false,
    renderer: !context.verbose && !context.env.CI ? 'default' : 'verbose'
  }).run(context)
}
