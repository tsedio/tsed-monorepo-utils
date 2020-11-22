import chalk from 'chalk'
import { git } from '../cli'

export async function pushBranchExample (projectOptions, context) {
  const { tmpDir, mainBranch, branch, project } = projectOptions
  await git.push('--set-upstream', '-f', `${branch}:${branch}`).cwd(tmpDir)
  context.logger.warn(chalk.cyan(`${branch} cannot be merged into ${mainBranch} for the '${project}'.`))
  context.projectsInConflict.push(projectOptions)
}

export async function pushMainBranchExample (projectOptions) {
  const { tmpDir, mainBranch } = projectOptions
  await git.push('--set-upstream', '-f', `${mainBranch}:${mainBranch}`).cwd(tmpDir)
}