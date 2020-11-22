import { ensureDirSync } from 'fs-extra'
import { git } from '../cli'
import { clean } from '../common/clean'
import { createTasksRunner } from '../common/createTasksRunner'

export function checkoutExample (projectOptions, context) {
  const { version } = context
  const { tmpDir, remoteUrl } = projectOptions

  return createTasksRunner([
    {
      title: 'Clean',
      task: async () => {
        await clean([tmpDir])
        ensureDirSync(tmpDir)
      }
    },
    {
      title: 'Git init',
      task: () => git.init().cwd(tmpDir).toObservable()
    },
    {
      title: 'Git remote add',
      task: () => git.remote('add', 'origin', remoteUrl).cwd(tmpDir).toObservable()
    },
    {
      title: 'Get main branch',
      task: () => {
        projectOptions.mainBranch = git.getMainBranch({ cwd: tmpDir })
        projectOptions.branch = `chore-v${version}`
        projectOptions.tmpDir = tmpDir
      }
    },
    {
      title: 'Git fetch',
      task: () => git.fetch().cwd(tmpDir).toObservable()
    },
    {
      title: 'Git checkout',
      task: () => git.checkout('-b', projectOptions.branch, `origin/${projectOptions.mainBranch}`).cwd(tmpDir)
    }
  ], { ...context, run: false, concurrent: false })
}

