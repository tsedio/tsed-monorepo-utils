import { git } from '../cli/Git'
import { writeFileSync } from 'fs'

export async function publishGhPages (context) {
  const {
    ghpages,
    version,
    ghToken
  } = context

  if (ghpages.dir) {
    writeFileSync(`${ghpages.dir}/CNAME`, ghpages.cname, {})

    await git.init().cwd(ghpages.dir)
    await git.add('-A').cwd(ghpages.dir)
    await git.commit('-m', `'Deploy documentation v${version}'`).cwd(ghpages.dir)

    await git.push('--set-upstream', '-f', `https://${ghToken}@${ghpages.url}`, `master:${ghpages.branch}`).cwd(ghpages.dir)
  }
}
