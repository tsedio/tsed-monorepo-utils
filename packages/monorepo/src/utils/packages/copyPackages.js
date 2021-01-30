import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { copy } from '../common/copy'
import { findPackages } from './findPackages'

export async function copyPackages ({ rootDir, outputDir, packagesDir = 'packages', silent = false, ignore = [] }) {
  const packages = await findPackages({
    cwd: join(rootDir, packagesDir)
  })

  const ignores = packages.reduce((ignores, { path, name }) => {
    const file = path.replace('package.json', '.npmignore')

    if (existsSync(file)) {
      ignores.push(
        ...readFileSync(file, { encoding: 'utf8' })
          .split('\n')
          .filter(Boolean)
          .map((rule) => `!${packagesDir}/${name}/${rule}`))
    }

    return ignores
  }, [])

  let patterns = packages
    .reduce((patterns, { name }) => {
      return [
        ...patterns,
        `${packagesDir}/${name}/**`,
        `${packagesDir}/${name}/**/.*`
      ]
    }, [])

  await copy([
      ...patterns,
      ...ignores,
      `!${packagesDir}/*/tsconfig.compile.json`,
      `!${packagesDir}/*/test/**`,
      `!${packagesDir}/*/package-lock.json`,
      `!${packagesDir}/*/yarn.lock`,
      `!${packagesDir}/*/node_modules/**`
    ],
    {
      baseDir: packagesDir,
      outputDir
    }
  )
}
