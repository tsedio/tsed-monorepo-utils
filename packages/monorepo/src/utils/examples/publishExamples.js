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

    await syncExampleDependencies(project)

    git.init().cwd(cwd).sync()
    git.add('-A').cwd(cwd).sync()
    git.commit('-m', `'Deploy project with Ts.ED v${version}'`).cwd(cwd).sync()

    await git.push('--set-upstream', '-f', `https://${ghToken}@${repository}`, `master:v${version}`).cwd(cwd)
    await git.push('--set-upstream', '-f', `https://${ghToken}@${repository}`, `master:master`).cwd(cwd)
  }
}

export async function publishExamples (context) {
  return Promise.all(findExamples(context).map((project) => publishExample(project, context)))
}
