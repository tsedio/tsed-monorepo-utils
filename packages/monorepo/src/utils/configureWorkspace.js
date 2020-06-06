import { git } from './cli/Git'

export function configureWorkspace (context) {
  const {origin, logger, env: { GH_TOKEN, CI, EMAIL, USER, CI_NAME, REPOSITORY_URL }, branchName } = context

  if (CI) {
    if (EMAIL && USER) {
      git.config('--global', 'user.email', EMAIL)
      git.config('--global', 'user.name', USER)
    }

    git.checkout(branchName).sync()
    git.branch(`--set-upstream-to=${origin}/${branchName}`, branchName).sync()

    logger.success(`${CI_NAME} CI Installed`)

    if (GH_TOKEN) {
      const repository = REPOSITORY_URL.replace('https://', '')
      logger.info(`Configure remote repository ${repository}`)
      git.remote('remove', origin)
      git.remove('add', origin, `https://${GH_TOKEN}@${repository}`).sync()
    }
  } else {
    logger.warn('Not in CI environment')
  }
}
