import { ensureDirSync } from 'fs-extra'
import { join } from 'path'
import { git } from '../cli'

export async function checkoutExample (projectOptions, context) {
  const { version, rootDir } = context
  const { project, remoteUrl } = projectOptions

  const tmpDir = join(rootDir, '.tmp', project)
  ensureDirSync(tmpDir)

  await git.init().cwd(tmpDir)
  await git.remote('add', 'origin', remoteUrl).cwd(tmpDir)

  const mainBranch = git.getMainBranch()

  projectOptions.mainBranch = mainBranch
  projectOptions.branch = `chore-v${version}`
  projectOptions.tmpDir = tmpDir

  await git.checkout('-b', projectOptions.branch, `origin/${mainBranch}`).cwd(tmpDir)

  return projectOptions
}

