import { heroku } from '../cli/Heroku'

export async function publishHeroku (context) {
  const { heroku: { app } } = context

  if (app) {
    heroku.containerLogin().sync()
    await heroku.containerPush('web', '-a', app)
    await heroku.containerRelease('web', '-a', app)
  }
}
