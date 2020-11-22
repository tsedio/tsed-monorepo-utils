import { git } from "../cli";
import { createTasksRunner } from "../common/createTasksRunner";

export function commitAndMergeExample(projectOptions, context) {
  const { version } = context;
  const { tmpDir, mainBranch, branch } = projectOptions;

  return createTasksRunner([
    {
      title: `Git add change`,
      task: () => git.add(".").cwd(tmpDir).toObservable()
    },
    {
      title: "Git commit: Update project",
      task: () => git.commit("-m", `Update project with v${version}`).cwd(tmpDir).catch(() => Promise.resolve())
    },
    {
      title: "Git checkout",
      task: () => {
        try {
          git.checkout("-b", mainBranch, `origin/${mainBranch}`).cwd(tmpDir).sync();
          projectOptions.pushOnMain = true;
        } catch (er) {
          projectOptions.pushOnMain = false;
          git.checkout("-qf", mainBranch).sync({ cwd: tmpDir }).sync();
          git.reset("--hard", `refs/heads/${mainBranch}`).cwd(tmpDir);
        }
      }
    },
    {
      title: `Git merge ${branch}`,
      task: () => git.merge("--no-ff", "-m", `"Merge ${branch}"`, branch).cwd(tmpDir).toObservable()
    },
    {
      title: `Git tag ${branch}`,
      task: () => git.tag("-a", `v${version}`, "-m", `"v${version}"`).cwd(tmpDir).toObservable()
    }
  ], { ...context, run: false, concurrent: false });
}