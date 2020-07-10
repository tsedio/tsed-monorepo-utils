import { join } from 'path'
import { git } from '../cli/Git'
import { syncExampleDependencies } from './syncExamplesDependencies'
import { findExamples } from './findExamples'

async function publishExample (project, context) {
  const { version, examplesDir, examplesRepositories = {}, env: { GH_TOKEN } } = context
  const currentExample = examplesRepositories[project]

  if (currentExample) {
    const { url } = currentExample
    const repository = url.replace('https://', '')

    const cwd = join(examplesDir, project)

    await syncExampleDependencies(project)

    git.init().cwd(cwd).sync()
    git.add('-A').cwd(cwd).sync()
    git.commit('-m', `'Deploy project with Ts.ED v${version}'`).cwd(cwd).sync()

    await git.push('--set-upstream', '-f', `https://${GH_TOKEN}@${repository}`, `master:v${version}`).cwd(cwd)
    await git.push('--set-upstream', '-f', `https://${GH_TOKEN}@${repository}`, `master:master`).cwd(cwd)
  }
}

export async function publishExamples (context) {
  return Promise.all(findExamples(context).map((project) => publishExample(project, context)))
}
