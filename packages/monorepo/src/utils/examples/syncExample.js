import chalk from "chalk";
import { clean } from "../common/clean";
import { createTasksRunner } from "../common/createTasksRunner";
import { checkoutExample } from "./checkoutExample";
import { commitAndMergeExample } from "./commitAndMergeExample";
import { copyExampleFromSource, copyExampleFromWorkspace } from "./copyExample";
import { createExampleOptions } from "./createExampleOptions";
import { findExamples } from "./findExamples";
import { installExampleDependencies } from "./installExampleDependencies";
import { pushBranchExample, pushMainBranchExample } from "./pushExample";
import { syncExampleDependencies } from "./syncExamplesDependencies";

export function syncExample(projectOptions, context) {
  return createTasksRunner([
    {
      title: "Checkout",
      task: () => checkoutExample(projectOptions, context)
    },
    {
      title: "Copy sources",
      task: () => copyExampleFromSource(projectOptions, context)
    },
    {
      title: "Sync dependencies",
      task: () => syncExampleDependencies(projectOptions, context)
    },
    {
      title: "Install dependencies",
      task: () => installExampleDependencies(projectOptions).toObservable()
    },
    {
      title: "Copy workspace",
      enabled: () => projectOptions.sync,
      task: () => copyExampleFromWorkspace(projectOptions, context)
    },
    {
      title: "Commit merge",
      enabled: () => projectOptions.push,
      task: () => commitAndMergeExample(projectOptions, context)
    },
    {
      title: "Push on main branch",
      enabled: () => projectOptions.push && projectOptions.pushOnMain,
      task: () => pushMainBranchExample(projectOptions, context).toObservable()
    },
    {
      title: "Push on branch because there is conflict",
      enabled: () => projectOptions.push && !projectOptions.pushOnMain,
      task: () => pushBranchExample(projectOptions, context).toObservable()
    },
    {
      title: "Copy updated to file to source",
      enabled: () => projectOptions.sync,
      task: () => clean([projectOptions.tmpDir])
    }
  ], { ...context, run: false, concurrency: false });
}

export function syncExamples(context) {
  const tasks = findExamples(context).map((project) => {
    const { examples: { repositories = {} } } = context;
    const currentExample = repositories[project];

    if (currentExample) {
      const projectOptions = createExampleOptions(project, context);
      projectOptions.sync = true;
      return {
        title: "Sync example '" + chalk.cyan(project) + "'",
        task: () => syncExample(projectOptions, context)
      };
    }
  })
    .filter(Boolean);

  return createTasksRunner(tasks, {
    ...context,
    run: false,
    concurrent: false
  });
}
