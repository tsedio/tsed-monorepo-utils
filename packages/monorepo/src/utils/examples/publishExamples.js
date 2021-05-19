import chalk from 'chalk'
import { createTasksRunner } from '../common/createTasksRunner'
import { createExampleOptions } from './createExampleOptions'
import { syncExample } from './syncExample'

/**
 *
 * @param context {MonoRepo}
 * @returns {HTMLElement|*}
 */
export function publishExamples (context) {
  const { examples: { repositories = {} } } = context

  const tasks = Object.keys(repositories).map((project) => {
    const projectOptions = createExampleOptions(project, context)
    projectOptions.sync = true
    projectOptions.push = true
    return {
      title: `Sync example '${chalk.cyan(project)}'`,
      task: () => syncExample(projectOptions, context)
    }
  })

  return createTasksRunner(tasks, {
    ...context,
    run: false,
    concurrent: context.env.CI ? false : 4
  })
}
