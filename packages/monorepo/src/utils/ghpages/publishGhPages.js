import {writeFileSync} from "fs";
import {git} from "../cli/Git";

/**
 *
 * @param context {MonoRepo}
 * @returns {Promise<void[]>}
 */
export async function publishGhPages(context) {
  const {ghpages, version, ghToken, env} = context;

  const promises = [].concat(ghpages).map(async () => {
    if (ghpages.dir) {
      const repository = ghpages.url.split("://")[1] || ghpages.url;

      writeFileSync(`${ghpages.dir}/CNAME`, ghpages.cname, {});

      await git.init().cwd(ghpages.dir);
      await git.add("-A").cwd(ghpages.dir);
      await git.commit("-m", `Deploy documentation v${version}`).cwd(ghpages.dir);

      if (env.CI) {
        await git.push("--set-upstream", "-f", `https://${ghToken}@${repository}`, `master:${ghpages.branch}`).cwd(ghpages.dir);
      } else {
        await git.push("--set-upstream", "-f", `https://${repository}`, `master:${ghpages.branch}`).cwd(ghpages.dir);
      }
    }
  });

  await Promise.all(promises);
}
