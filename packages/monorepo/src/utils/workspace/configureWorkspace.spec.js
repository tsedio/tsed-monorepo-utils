import {git} from "../cli/Git.js";
import {configureWorkspace} from "./configureWorkspace.js";

// Mock Git CLI used by configureWorkspace (../cli/Git.js)
vi.mock("../cli/Git.js", () => {
  const mk = () => ({sync: vi.fn(() => ({}))});
  return {
    git: {
      config: vi.fn(() => undefined),
      checkout: vi.fn(mk),
      branch: vi.fn(mk),
      remote: vi.fn(mk)
    }
  };
});

describe("configureWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function ctx(overrides = {}) {
    return {
      origin: "origin",
      repositoryUrl: "https://github.com/org/repo.git",
      logger: {info: vi.fn(), warn: vi.fn(), error: vi.fn()},
      ghToken: "TOKEN",
      env: {CI: true, EMAIL: "dev@example.com", USER: "Dev", CI_NAME: "GH"},
      branchName: "main",
      ...overrides
    };
  }

  it("warns when not in CI", () => {
    const c = ctx({env: {CI: false}});
    configureWorkspace(c);
    expect(c.logger.warn).toHaveBeenCalledWith("Not in CI environment");
    expect(git.checkout).not.toHaveBeenCalled();
  });

  it("errors and exits when GH token is missing", () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined);
    const c = ctx({ghToken: undefined});

    configureWorkspace(c);

    expect(c.logger.error).toHaveBeenCalledWith("GH_TOKEN is required");
    expect(exitSpy).toHaveBeenCalledWith(-1);

    exitSpy.mockRestore();
  });

  it("configures git user, checks out branch, sets upstream and reconfigures remote when in CI with token", () => {
    const c = ctx();

    configureWorkspace(c);

    // sets git user when EMAIL/USER provided
    expect(git.config).toHaveBeenCalledWith("--global", "user.email", "dev@example.com");
    expect(git.config).toHaveBeenCalledWith("--global", "user.name", "Dev");

    // checkout current branch and set upstream
    expect(git.checkout).toHaveBeenCalledWith("main");
    expect(git.branch).toHaveBeenCalledWith("--set-upstream-to=origin/main", "main");

    // remote remove/add with tokenized URL
    expect(git.remote).toHaveBeenCalledWith("remove", "origin");
    expect(git.remote).toHaveBeenCalledWith("add", "origin", "https://TOKEN@github.com/org/repo.git");
  });
});
