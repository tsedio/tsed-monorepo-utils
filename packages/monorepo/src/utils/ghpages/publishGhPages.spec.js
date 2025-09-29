// Mocks must be declared before importing the module under test
vi.mock("fs", () => {
  const existsSync = vi.fn();
  const writeFileSync = vi.fn();
  return {existsSync, writeFileSync};
});

vi.mock("../cli/Git.js", () => {
  const mk = () => ({cwd: vi.fn(() => Promise.resolve())});
  return {git: {init: vi.fn(mk), add: vi.fn(mk), commit: vi.fn(mk), push: vi.fn(mk)}};
});

import {publishGhPages} from "./publishGhPages.js";
import {git} from "../cli/Git.js";
import {existsSync, writeFileSync} from "fs";

function ctx(overrides = {}) {
  return {
    ghpages: [{dir: "/site", url: "https://github.com/org/repo.git", branch: "gh-pages", cname: "example.com"}],
    version: "1.2.3",
    ghToken: "TOKEN",
    env: {},
    branch: {name: "main"},
    ...overrides
  };
}

describe("publishGhPages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips when dir does not exist", async () => {
    const c = ctx();
    await publishGhPages(c);
    expect(git.init).not.toHaveBeenCalled();
  });

  it("writes CNAME and .nojekyll, then pushes with token in CI", async () => {
    const c = ctx({env: {CI: true}});

    existsSync.mockImplementation((p) => p === "/site");

    await publishGhPages(c);

    // CNAME and .nojekyll writes
    expect(writeFileSync).toHaveBeenCalledWith("/site/CNAME", "example.com", {});
    expect(writeFileSync).toHaveBeenCalledWith("/site/.nojekyll", "", {});

    expect(git.init).toHaveBeenCalled();
    expect(git.add).toHaveBeenCalledWith("-A");
    expect(git.commit).toHaveBeenCalledWith("-m", "Deploy documentation v1.2.3");
    // push should be called with token in URL
    expect(git.push).toHaveBeenCalledWith("--set-upstream", "-f", "https://TOKEN@github.com/org/repo.git", "master:gh-pages");
  });

  it("filters by branch if condition provided and pushes without token when not CI", async () => {
    const c = ctx({
      env: {},
      branch: {name: "docs"},
      ghpages: [{dir: "/site", url: "github.com/org/repo.git", branch: "gh-pages", cname: "example.com", if: "docs"}]
    });

    existsSync.mockImplementation((p) => p === "/site");

    await publishGhPages(c);

    expect(git.push).toHaveBeenCalledWith("--set-upstream", "-f", "https://github.com/org/repo.git", "master:gh-pages");
  });
});
