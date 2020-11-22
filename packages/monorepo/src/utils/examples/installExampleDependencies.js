import { npm, yarn } from '../cli'

export async function installExampleDependencies (projectOptions) {
  if (projectOptions.hasYarn) {
    await yarn.install()
  } else {
    await npm.install()
  }
}