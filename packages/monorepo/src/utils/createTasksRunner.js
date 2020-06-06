import Listr from 'listr'

export function createTasksRunner (tasks, context) {
  return new Listr(tasks, {
    concurrent: false,
    renderer: !context.verbose ? 'default' : 'verbose'
  }).run(context)
}
