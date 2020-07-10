import { git } from '../cli/Git'

export async function publishGhPages (context) {
  const {
    docDir,
    docUrl,
    docCname,
    docBranch,
    productionBranch,
    version
  } = context
  const { GH_TOKEN } = process.env

  if (docDir) {
    fs.writeFileSync(`${docDir}/CNAME`, docCname, {})

    git.init().cwd(docDir).sync()
    git.add('-A').cwd(docDir).sync()
    git.commit('-m', `Deploy documentation v${version}`).cwd(docDir).sync()

    await git.push('--set-upstream', '-f', `https://${GH_TOKEN}@${docUrl}`, `${productionBranch}:${docBranch}`).cwd(docDir)
  }
}
