import { Cli } from './Cli'

class NpmCli extends Cli {
  constructor () {
    super('npm')
  }

  newVersion (version) {
    return this.version('--no-git-tag-version', version)
  }

  version (...args) {
    return this.sync('version', ...args)
  }

  run (...args) {
    return super.run('run', ...args)
  }

  publish (...args) {
    return super.run('publish', ...args)
  }

  pack (...args) {
    return super.run('pack', ...args)
  }

  install (...args) {
    return super.run('install', ...args)
  }

  /**
   * Reinstall dependencies without package-lock mutation
   * @returns {Promise<unknown>}
   */
  restore () {
    return super.run('install', '--no-package-lock', '--no-production')
  }
}

export const npm = new NpmCli()
