import {compilePackages} from "../utils/packages/compilePackages";
import {copyPackages} from "../utils/packages/copyPackages";
import {writePackages} from "../utils/packages/writePackages";
import {syncDependencies} from "../utils/depencencies/syncDependencies";
import {clean} from "../utils/common/clean";

export function build(context) {
  return [
    {
      title: "Clean workspace",
      task: () => clean([context.outputDir])
    },
    {
      title: "Compile packages",
      task: () => compilePackages(context)
    },
    {
      title: "Sync dependencies",
      task: () => syncDependencies(context)
    },
    {
      title: "Copy packages",
      task: () => copyPackages(context)
    },
    {
      title: "Write package.json",
      task: () => writePackages(context)
    }
  ];
}
