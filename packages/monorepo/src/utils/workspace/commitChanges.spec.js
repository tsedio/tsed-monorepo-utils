import {git} from "../cli/index.js";
import {commitChanges} from "./commitChanges.js";

// Mock git cli from ../cli/index.js BEFORE importing the module
vi.mock("../cli/index.js", () => {
  const mk = (name) => ({sync: vi.fn(() => ({}))});
  const add = vi.fn(mk);
  const reset = vi.fn(() => ({}));
  const status = vi.fn(() => "STATUS");
  const commit = vi.fn(mk);
  const push = vi.fn(mk);
  return {git: {add, reset, status, commit, push}};
});

describe("commitChanges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function ctx(overrides = {}) {
    return {
      logger: {info: vi.fn(), warn: vi.fn(), error: vi.fn()},
      repositoryUrl: "https://github.com/org/repo.git",
      origin: "origin",
      productionBranch: "main",
      developBranch: "develop",
      version: "1.2.3",
      env: {CI: true, CI_NAME: "CI", CI_SKIP: "[skip ci]", BUILD_NUMBER: 42},
      ...overrides
    };
  }

  it("does nothing and warns when not in CI", () => {
    const c = ctx({env: {CI: false}});
    commitChanges(c);
    expect(c.logger.warn).toHaveBeenCalledWith("Not in CI environment");
    expect(git.add).not.toHaveBeenCalled();
  });

  it("adds, resets .npmrc, logs status and commits with expected message in CI", () => {
    const c = ctx();
    commitChanges(c);

    expect(git.add).toHaveBeenCalledWith("-A");
    // reset called on .npmrc
    expect(git.reset).toHaveBeenCalledWith("--", ".npmrc");

    // status output logged
    const statusLogCall = c.logger.info.mock.calls.find((args) => args[0] === "STATUS");
    expect(statusLogCall).toBeTruthy();

    // commit message
    expect(git.commit).toHaveBeenCalledWith("-m", "CI build: 42 v1.2.3 [skip ci]");
    expect(git.push).toHaveBeenCalledWith("--quiet", "origin", "HEAD:refs/heads/main");
  });
});
