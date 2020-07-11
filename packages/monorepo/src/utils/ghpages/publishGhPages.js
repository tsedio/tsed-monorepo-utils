import { git } from '../cli/Git'

export async function publishGhPages (context) {
  const {
    ghpages,
    productionBranch,
    version,
    ghToken,
  } = context

  if (ghpages.dir) {
    fs.writeFileSync(`${ghpages.dir}/CNAME`, ghpages.cname, {})

    git.init().cwd(ghpages.dir).sync()
    git.add('-A').cwd(ghpages.dir).sync()
    git.commit('-m', `'Deploy documentation v${version}'`).cwd(ghpages.dir).sync()

    await git.push('--set-upstream', '-f', `https://${ghToken}@${ghpages.url}`, `${productionBranch}:${ghpages.branch}`).cwd(ghpages.dir)
  }
}
