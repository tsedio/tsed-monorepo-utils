import hasYarn from 'has-yarn'
import { join } from 'path'

export function createExampleOptions (project, context) {
  const { examples: { dir, repositories = {} }, ghToken } = context
  const currentExample = repositories[project]

  const { url } = currentExample
  const repository = url.replace('https://', '')
  const srcDir = join(dir, project)

  context.projectsInConflict = context.projectsInConflict || []

  return {
    project,
    repository,
    remoteUrl: `https://${ghToken ? `${ghToken}@` : ''}${repository}`,
    srcDir: join(dir, project),
    hasYarn: hasYarn(srcDir)
  }
}
