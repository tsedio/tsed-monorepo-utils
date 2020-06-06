import 'any-observable/register/rxjs-all' // eslint-disable-line import/no-unassigned-import
import execa from 'execa'
import streamToObservable from '@samverschueren/stream-to-observable'
import { filter, merge } from 'rxjs/operators'
import split from 'split'
import { spawnSync } from 'child_process'

export class Cli {
  constructor (cmd) {
    this.cmd = cmd
  }

  sync (...args) {
    return Cli.run(this.cmd, args).sync()
  }

  run (...args) {
    return Cli.run(this.cmd, args)
  }

  get (...args) {
    return Cli.run(this.cmd, args).get()
  }

  static run (cmd, args, options = {}) {
    const run = (opt = {}) => {
      return execa(cmd, args, {
        cwd: process.cwd(),
        ...opt,
        ...options
      })
    }

    let isPromise = true

    const promise = new Promise((resolve, reject) => {
      setTimeout(async () => {
        if (isPromise) {
          try {
            resolve(await run({
              stdio: 'inherit'
            }))
          } catch (err) {
            reject(err)
          }
        } else {
          resolve()
        }
      })
    })

    promise.toObservable = () => {
      isPromise = false
      const cp = run()
      const stdout = streamToObservable(cp.stdout.pipe(split()), { await: cp })
      const stderr = streamToObservable(cp.stderr.pipe(split()), { await: cp })

      return stdout.pipe(merge(stderr)).pipe(filter(Boolean))
    }

    promise.toStream = (options) => {
      isPromise = false
      return run(options)
    }

    promise.sync = (opt) => {
      isPromise = false

      return execa.sync(cmd, args, {
        cwd: process.cwd(),
        stdio: 'inherit',
        ...options,
        ...opt
      })
    }

    promise.getRaw = () => {
      isPromise = false

      return spawnSync(cmd, args)
        .output.filter(o => !!o)
        .map(o => o.toString())
        .join('\n')
    }

    promise.get = () => {
      isPromise = false

      return execa.sync(cmd, args, {
        cwd: process.cwd()
      }).stdout
    }

    return promise
  }
}
