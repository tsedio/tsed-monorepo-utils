import hasYarn from 'has-yarn'
import { join } from 'path'

export function createExampleOptions (project, context) {
  const { rootDir, examples: { dir, repositories = {} }, ghToken } = context
  const currentExample = repositories[project]

  const { url } = currentExample
  const repository = url.replace('https://', '')
  const srcDir = join(rootDir, dir, project)
  const tmpDir = join(rootDir, '.tmp', project)

  context.projectsInConflict = context.projectsInConflict || []

  return {
    project,
    repository,
    remoteUrl: `https://${ghToken ? `${ghToken}@` : ''}${repository}`,
    srcDir,
    tmpDir,
    hasYarn: hasYarn(srcDir)
  }
}
