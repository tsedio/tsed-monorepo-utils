// define mocks before importing module under test
vi.mock("../cli/Heroku.js", () => {
  const sync = vi.fn();
  const containerLogin = vi.fn(() => ({sync}));
  const containerPush = vi.fn(async () => {});
  const containerRelease = vi.fn(async () => {});
  return {heroku: {containerLogin, containerPush, containerRelease}};
});

import {publishHeroku} from "./publishHeroku.js";
import {heroku} from "../cli/Heroku.js";

function makeCtx(overrides = {}) {
  return {
    heroku: {app: "myapp", team: undefined},
    ...overrides
  };
}

describe("publishHeroku", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when app is not provided", async () => {
    await publishHeroku(makeCtx({heroku: {}}));
    expect(heroku.containerLogin).not.toHaveBeenCalled();
  });

  it("logs in, pushes and releases using web -a app", async () => {
    await publishHeroku(makeCtx());

    expect(heroku.containerLogin).toHaveBeenCalled();
    // get the sync function from the return value of the first call
    const loginResult = heroku.containerLogin.mock.results[0].value;
    expect(loginResult.sync).toHaveBeenCalled();
    expect(heroku.containerPush).toHaveBeenCalledWith("web", "-a", "myapp");
    expect(heroku.containerRelease).toHaveBeenCalledWith("web", "-a", "myapp");
  });

  it("includes team flag when provided", async () => {
    await publishHeroku(makeCtx({heroku: {app: "myapp", team: "acme"}}));
    expect(heroku.containerPush).toHaveBeenCalledWith("web", "-a", "myapp", "-t", "acme");
    expect(heroku.containerRelease).toHaveBeenCalledWith("web", "-a", "myapp", "-t", "acme");
  });
});
