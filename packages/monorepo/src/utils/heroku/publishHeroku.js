import {heroku} from "../cli/Heroku.js";

/**
 *
 * @param context {MonoRepo}
 * @returns {Promise<void>}
 */
export async function publishHeroku(context) {
  const {
    heroku: {app, team}
  } = context;

  if (app) {
    const args = ["web", "-a", app, team && "-t", team].filter(Boolean);

    heroku.containerLogin().sync();
    await heroku.containerPush(...args);
    await heroku.containerRelease(...args);
  }
}
