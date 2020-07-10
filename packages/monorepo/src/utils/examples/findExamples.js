import glob from 'globby'
import { join } from 'path'

export function findExamples (context) {
  const projects = glob.sync('*/package.json', {
    cwd: join(process.cwd(), context.examplesDir)
  })

  return projects.map((project) => {
    return project.split('/')[0]
  })
}
