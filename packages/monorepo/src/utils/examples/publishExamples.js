import { join } from 'path'
import { git } from '../cli/Git'
import { syncExampleDependencies } from './syncExamplesDependencies'
import { findExamples } from './findExamples'

async function publishExample (project, context) {
  const { version, examples: { dir, repositories = {} }, ghToken} = context
  const currentExample = repositories[project]

  if (currentExample) {
    const { url } = currentExample
    const repository = url.replace('https://', '')

    const cwd = join(dir, project)

    await syncExampleDependencies(project, context)

    await git.init().cwd(cwd)
    await git.add('-A').cwd(cwd)
    await git.commit('-m', `Deploy project v${version}`).cwd(cwd)

    await git.push('--set-upstream', '-f', `https://${ghToken}@${repository}`, `master:v${version}`).cwd(cwd)
    await git.push('--set-upstream', '-f', `https://${ghToken}@${repository}`, `master:master`).cwd(cwd)
  }
}

export async function publishExamples (context) {
  return Promise.all(findExamples(context).map((project) => publishExample(project, context)))
}
