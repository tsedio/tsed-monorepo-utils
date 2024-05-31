import {compilePackages} from "../utils/packages/compilePackages.js";
import {copyPackages} from "../utils/packages/copyPackages.js";
import {writePackages} from "../utils/packages/writePackages.js";
import {syncDependencies} from "../utils/depencencies/syncDependencies.js";
import {clean} from "../utils/common/clean.js";
import {buildHybridPackage, buildHybridPackages} from "../utils/packages/buildHybridPackages.js";

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
    },
    {
      title: "Build hybrid CommonJS/ESM modules",
      task: () => buildHybridPackages(context)
    }
  ];
}
