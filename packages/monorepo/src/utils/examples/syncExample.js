import { clean } from '../common/clean'
import { checkoutExample } from './checkoutExample'
import { copyExampleFromSource, copyExampleFromWorkspace } from './copyExample'
import { createExampleOptions } from './createExampleOptions'
import { findExamples } from './findExamples'
import { installExampleDependencies } from './installExampleDependencies'
import { syncExampleDependencies } from './syncExamplesDependencies'

export async function syncExample (projectOptions, context) {
  await checkoutExample(projectOptions, context)
  await copyExampleFromSource(projectOptions, context)
  await syncExampleDependencies(projectOptions, context)
  await installExampleDependencies(projectOptions, context)
}

async function syncExampleOnly (project, context) {
  const { examples: { repositories = {} } } = context
  const currentExample = repositories[project]

  if (currentExample) {
    const projectOptions = createExampleOptions(project, context)

    await syncExample(projectOptions, context)
    await copyExampleFromWorkspace(projectOptions, context)
    await clean([projectOptions.tmpDir])
  }
}

export async function syncExamples (context) {
  return Promise.all(findExamples(context).map(async (project) => {
    return syncExampleOnly(project, context)
  }))
}
