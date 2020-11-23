import chalk from 'chalk'
import { createTasksRunner } from '../common/createTasksRunner'
import { createExampleOptions } from './createExampleOptions'
import { findExamples } from './findExamples'
import { syncExample } from './syncExample'

export function publishExamples (context) {
  const tasks = findExamples(context).map((project) => {
    const { examples: { repositories = {} } } = context
    const currentExample = repositories[project]

    if (currentExample) {
      const projectOptions = createExampleOptions(project, context)
      projectOptions.sync = true
      projectOptions.push = true

      return {
        title: `Sync example '${chalk.cyan(project)}'`,
        task: () => syncExample(projectOptions, context)
      }
    }
  })
    .filter(Boolean);

  return createTasksRunner(tasks, {
    ...context,
    run: false,
    concurrent: context.env.CI ? false : 4
  })
}
