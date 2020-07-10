import { Cli } from './cli'

export class HerokuCli extends Cli {
  constructor () {
    super('heroku')
  }

  containerLogin (...args) {
    return this.run('container:login', ...args)
  }

  containerPush (...args) {
    return this.run('container:push', ...args)
  }

  containerRelease (...args) {
    return this.run('container:release', ...args)
  }
}

export const heroku = new HerokuCli()
