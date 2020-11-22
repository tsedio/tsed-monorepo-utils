import { copy } from '../common/copy'

export async function copyExampleFromSource (projectOptions) {
  await copy([
      '**',
      '.*',
      '**/.*',
      '!.git',
      '!node_modules',
      '!**/node_modules'
    ],
    {
      baseDir: projectOptions.srcDir,
      outputDir: projectOptions.tmpDir
    }
  )

  return projectOptions
}

export async function copyExampleFromWorkspace (projectOptions) {
  await copy([
      '**',
      '.*',
      '**/.*',
      '!.git',
      '!node_modules',
      '!**/node_modules'
    ],
    {
      baseDir: projectOptions.tmpDir,
      outputDir: projectOptions.srcDir
    }
  )

  return projectOptions
}
