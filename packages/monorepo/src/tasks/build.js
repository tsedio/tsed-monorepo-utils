import { compilePackages } from '../utils/compilePackages'
import { copyPackages } from '../utils/copyPackages'
import { writePackages } from '../utils/writePackages'
import { syncDependencies } from '../utils/syncDependencies'
import { clean } from '../utils/clean'

export function build (context) {
  return [
    {
      title: 'Clean workspace',
      task: () => clean([
        context.outputDir
      ])
    },
    {
      title: 'Compile packages',
      task: () => compilePackages(context)
    },
    {
      title: 'Sync dependencies',
      task: () => syncDependencies(context)
    },
    {
      title: 'Copy packages',
      task: () => copyPackages(context)
    },
    {
      title: 'Write package.json',
      task: () => writePackages(context)
    }
  ]
}
