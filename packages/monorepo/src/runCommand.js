import chalk from "chalk";
import figures from "figures";
import inquirer from "inquirer";
import {MonoRepo} from "./MonoRepo.js";
import {createTasksRunner} from "./utils/common/createTasksRunner.js";

async function importConfig() {
  try {
    return await import(`${process.cwd()}/release.config.mjs`);
  } catch (er) {
    try {
      return await import(`${process.cwd()}/release.config.js`);
    } catch (er) {
      return {};
    }
  }
}

export async function runCommand(klass, options) {
  try {
    const config = await importConfig();

    const monoRepo = new MonoRepo({
      rootDir: process.cwd(),
      verbose: !!options.verbose,
      ...(config.default || config)
    });

    // eslint-disable-next-line new-cap
    const command = new klass();

    // Map context from commander and current context
    if (command.mapContext) {
      Object.assign(monoRepo, command.mapContext(options, monoRepo));
    }

    // show prompts
    if (command.prompt) {
      Object.assign(monoRepo, await inquirer.prompt(command.prompt(context)));
    }

    // Verify conditions
    command.verifyConditions && command.verifyConditions(monoRepo);

    // Get tasks
    const tasks = command.getTasks(monoRepo);

    // Run tasks
    await createTasksRunner(tasks, monoRepo);
    command.success && command.success(monoRepo);
  } catch (er) {
    // eslint-disable-next-line no-console
    console.error(chalk.red(figures.cross), String(er), er.stack);
    process.exit(-1);
  }
}
