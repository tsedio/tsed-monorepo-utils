import { copy } from '../common/copy'

export async function copyExampleFromSource (projectOptions) {
  const { srcDir, tmpDir } = projectOptions
  await copy([
      srcDir + '/**',
      srcDir + '/.*',
      srcDir + '/**/.*',
      `!${srcDir}/.git`,
      `!${srcDir}/node_modules`,
      `!${srcDir}/**/node_modules`
    ],
    {
      baseDir: srcDir,
      outputDir: tmpDir
    }
  )

  return projectOptions
}

export async function copyExampleFromWorkspace (projectOptions) {
  const { srcDir, tmpDir } = projectOptions

  await copy([
      tmpDir + '/**',
      tmpDir + '/.*',
      tmpDir + '/**/.*',
      `!${tmpDir}/.git`,
      `!${tmpDir}/node_modules`,
      `!${tmpDir}/**/node_modules`
    ],
    {
      baseDir: tmpDir,
      outputDir: srcDir
    }
  )

  return projectOptions
}
