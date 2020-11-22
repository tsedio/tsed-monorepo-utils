import { npm, yarn } from '../cli'

export function installExampleDependencies (projectOptions) {
  return projectOptions.hasYarn ? yarn.install().cwd(projectOptions.tmpDir) : npm.install().cwd(projectOptions.tmpDir)
}