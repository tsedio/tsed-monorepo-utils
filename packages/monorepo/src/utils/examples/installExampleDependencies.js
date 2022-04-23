import {yarn} from "../cli/index.js";

export function installExampleDependencies(projectOptions) {
  return yarn.install().cwd(projectOptions.tmpDir);
}
