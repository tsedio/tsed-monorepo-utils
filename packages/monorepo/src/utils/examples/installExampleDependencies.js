import { yarn } from '../cli'

export function installExampleDependencies (projectOptions) {
  return yarn.install().cwd(projectOptions.tmpDir)
}