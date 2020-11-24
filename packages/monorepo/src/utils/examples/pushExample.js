import { git } from '../cli'

export function pushBranchExample (projectOptions, context) {
  const { tmpDir, branch, remoteUrl } = projectOptions
  context.projectsInConflict.push(projectOptions)

  return git.push('--set-upstream', '-f', remoteUrl, `${branch}:${branch}`).cwd(tmpDir)
}

export function pushTagsExample (projectOptions) {
  const { tmpDir, remoteUrl } = projectOptions

  return git.push(remoteUrl, `--tags`).cwd(tmpDir)
}

export function pushMainBranchExample (projectOptions) {
  const { tmpDir, mainBranch, remoteUrl } = projectOptions
  return git.push('--set-upstream', '-f', remoteUrl, `${mainBranch}:${mainBranch}`).cwd(tmpDir)
}