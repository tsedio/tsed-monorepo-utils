export class DocsCmd {
  getTasks (context) {
    if (context.action !== 'publish') {
      return []
    }

    return [
      {
        title: 'Publish documentation on GithubPages',
        task: () => context.publishGhPages()
      }
    ]
  }
}
