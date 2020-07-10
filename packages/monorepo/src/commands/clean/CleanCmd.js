import { clean } from '../../utils/common/clean'

export class CleanCmd {
  getTasks (context) {
    return [
      {
        title: 'Clean workspace',
        enable: context.type === 'workspace',
        task: () => clean(['dist'])
      },
      {
        title: 'Clean dist',
        enable: context.type === 'workspace',
        task: () => clean([
          'test/**/*.{js,js.map,d.ts}',
          'test/**/*.{js,js.map,d.ts}',
          'packages/**/src/**/*.{js,js.map,d.ts,d.ts.map}',
          'packages/**/node_modules'
        ])
      }
    ]
  }
}
