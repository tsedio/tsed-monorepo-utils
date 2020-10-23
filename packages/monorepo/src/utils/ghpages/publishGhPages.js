import { writeFileSync } from 'fs'
import { git } from '../cli/Git'

export async function publishGhPages (context) {
  const {
    ghpages,
    version,
    ghToken,
    env
  } = context

  if (ghpages.dir) {
    const repository = ghpages.url.split('://')[1] || ghpages.url

    writeFileSync(`${ghpages.dir}/CNAME`, ghpages.cname, {})

    await git.init().cwd(ghpages.dir)
    await git.add('-A').cwd(ghpages.dir)
    await git.commit('-m', `Deploy documentation v${version}`).cwd(ghpages.dir)

    if (env.CI) {
      await git.push('--set-upstream', '-f', `https://${ghToken}@${repository}`, `master:${ghpages.branch}`).cwd(ghpages.dir)
    } else {
      await git.push('--set-upstream', '-f', `https://${repository}`, `master:${ghpages.branch}`).cwd(ghpages.dir)
    }
  }
}
