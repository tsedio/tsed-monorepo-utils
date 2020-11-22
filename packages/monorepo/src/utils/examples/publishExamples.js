import { clean } from '../common/clean'
import { commitAndMergeExample } from './commitAndMergeExample'
import { copyExampleFromWorkspace } from './copyExample'
import { createExampleOptions } from './createExampleOptions'
import { findExamples } from './findExamples'
import { pushBranchExample, pushMainBranchExample } from './pushExample'
import { syncExample } from './syncExample'


async function publishExample (project, context) {
  const { examples: { repositories = {} } } = context
  const currentExample = repositories[project]

  if (currentExample) {
    const projectOptions = createExampleOptions(project, context)
    await syncExample(projectOptions, context)

    if (await commitAndMergeExample(projectOptions, context)) {
      await pushMainBranchExample(projectOptions, context)
    } else {
      await pushBranchExample(projectOptions, context)
    }

    await copyExampleFromWorkspace(projectOptions, context)
    await clean([projectOptions.tmpDir])
  }
}

export async function publishExamples (context) {
  return Promise.all(findExamples(context).map((project) => publishExample(project, context)))
}
