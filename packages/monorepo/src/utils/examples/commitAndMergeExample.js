import { git } from '../cli'

export async function commitAndMergeExample (projectOptions, context) {
  const { version } = context
  const { tmpDir, mainBranch, branch, project } = projectOptions

  await git.commit('-m', `Update project with v${version}`).cwd(tmpDir)

  try {
    await git.checkout('-b', mainBranch, `origin/${mainBranch}`).cwd(tmpDir)
  } catch (er) {
    await git.checkout('-qf', mainBranch)
    await git.reset('--hard', `refs/heads/${mainBranch}`).cwd(tmpDir)
  }

  try {
    await git.merge('--no-ff', '-m', `${branch}`, branch).cwd(tmpDir)
    await git.tag('-a', branch)
    return true
  } catch (er) {
    return false
  }
}