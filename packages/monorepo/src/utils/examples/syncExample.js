import chalk from "chalk";
import {clean} from "../common/clean.js";
import {createTasksRunner} from "../common/createTasksRunner.js";
import {checkoutExample} from "./checkoutExample.js";
import {commitAndMergeExample} from "./commitAndMergeExample.js";
import {createExampleOptions} from "./createExampleOptions.js";
import {installExampleDependencies} from "./installExampleDependencies.js";
import {pushBranchExample, pushMainBranchExample, pushTagsExample} from "./pushExample.js";
import {syncExampleDependencies} from "./syncExamplesDependencies.js";

export function syncExample(projectOptions, context) {
  return createTasksRunner(
    [
      {
        title: "Checkout",
        task: () => checkoutExample(projectOptions, context)
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
        title: "Push tags",
        enabled: () => projectOptions.push,
        task: async () => {
          try {
            await pushTagsExample(projectOptions, context);
          } catch (er) {}
        }
      },
      {
        title: "Clean",
        enabled: () => projectOptions.sync,
        task: () => clean([projectOptions.tmpDir])
      }
    ],
    {...context, run: false, concurrent: false}
  );
}

export function syncExamples(context) {
  const {
    examples: {repositories = {}}
  } = context;

  const tasks = Object.keys(repositories).map((project) => {
    const projectOptions = createExampleOptions(project, context);
    projectOptions.sync = true;
    return {
      title: "Sync example '" + chalk.cyan(project) + "'",
      task: () => syncExample(projectOptions, context)
    };
  });

  return createTasksRunner(tasks, {
    ...context,
    run: false,
    concurrent: context.env.CI ? false : 4
  });
}
