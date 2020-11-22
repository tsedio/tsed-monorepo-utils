import { Cli } from './Cli'

class GitCli extends Cli {
  constructor () {
    super('git')
  }

  init (...args) {
    return this.run('init', ...args)
  }

  add (...args) {
    return this.run('add', ...args)
  }

  status (...args) {
    return this.sync('status', ...args)
  }

  branch (...args) {
    return this.run('branch', ...args)
  }

  config (...args) {
    return this.get('config', ...args)
  }

  checkout (...args) {
    return this.run('checkout', ...args)
  }

  commit (...args) {
    return this.run('commit', ...args)
  }

  fetch (...args) {
    return this.run('fetch', ...args)
  }

  prune (...args) {
    return this.run('prune', ...args)
  }

  merge (...args) {
    return this.run('merge', ...args)
  }

  tag (...args) {
    return this.run('tag', ...args)
  }

  reset (...args) {
    return this.sync('reset', ...args)
  }

  remote (...args) {
    return this.run('remote', ...args)
  }

  rebase (...args) {
    return this.run('rebase', ...args)
  }

  getCommitTag (ref = 'HEAD') {
    return this.get('rev-parse', '--short', ref)
  }

  getBranchName (ref = 'HEAD') {
    return this.get('rev-parse', '--abbrev-ref', ref)
  }

  getLastCommitMsg () {
    return this.get('log', '-1', '--pretty=%B')
  }

  push (...args) {
    return this.run('push', ...args)
  }

  branchExists (branch, origin = 'origin') {
    return (
      this.branch('-a')
        .getRaw()
        .trim()
        .includes(`remotes/${origin}/${branch}`)
    )
  }

  checkBranchRemoteStatus (branch, origin = 'origin') {
    return this.getRaw('cherry', branch, `${origin}/${branch}`).trim()
  }

  branches (options) {
    return this.branch()
      .getRaw(options)
      .split('\n')
      .map(branch => branch.trim().replace('* ', ''))
      .filter(branch => !!branch)
      .filter(branch => !String(branch).includes('/HEAD'))
  }

  show (branch) {
    return this.run('show', '--format="%ci|%cr|%an"', branch, '--')
      .getRaw()
      .split('\n')[0]
      .trim()
  }

  branchesInfos (options) {
    return this
      .branches(options)
      .map(branch => {
        try {
          const [date, creation, author] = this.show(branch).split('|')
          return {
            branch,
            date,
            creation,
            author
          }
        } catch (er) {
          return undefined
        }
      })
      .filter((b) => !!b)
      .sort((info1, info2) => info1.date < info2.date)
  }

  getMainBranch (options) {
    const branches = git.branchesInfos(options)
    return (branches.find(({ branch }) => branch === 'main')
      || branches.find(({ branch }) => branch === 'production')
      || branches.find(({ branch }) => branch === 'master')
      || { branch: 'master' }).branch
  }
}

export const git = new GitCli()
