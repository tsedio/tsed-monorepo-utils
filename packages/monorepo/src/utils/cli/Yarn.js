import { Cli } from './Cli'

class YarnCli extends Cli {
  constructor () {
    super('yarn')
  }

  newVersion (version) {
    return this.version('--no-git-tag-version', '--new-version', version)
  }

  version (...args) {
    return this.sync('version', ...args)
  }

  run (...args) {
    return super.run(...args)
  }

  install (...args) {
    return super.run('add', ...args)
  }

  /**
   * Reinstall dependencies without yarn.lock mutation
   * @returns {Promise<unknown>}
   */
  restore () {
    return super.run('install', '--frozen-lockfile', '--production=false')
  }
}

export const yarn = new YarnCli()
