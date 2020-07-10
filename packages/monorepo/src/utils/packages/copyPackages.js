import { existsSync, readFileSync } from 'fs'
import { findPackages } from './findPackages'
import { copy } from '../common/copy'
import { join } from 'path'

export async function copyPackages ({ rootDir, outputDir, packagesDir = 'packages', silent = false, ignore = [] }) {
  const packages = await findPackages({
    cwd: join(rootDir, packagesDir)
  })

  let names = packages.map(({ name }) => name).join(',')

  names = names.includes(',') ? `{${names}}` : names

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

  await copy([
      `${packagesDir}/${names}/**`,
      `${packagesDir}/${names}/**/.*`,
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
