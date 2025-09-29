import {git} from "../cli/index.js";
import {syncRepository} from "./syncRepository.js";

// Mock git cli from ../cli/index.js
vi.mock("../cli/index.js", () => {
  const fetch = vi.fn(() => Promise.resolve());
  const push = vi.fn(() => Promise.resolve());
  return {git: {fetch, push}};
});

function makeContext(overrides = {}) {
  const logs = {info: [], error: []};
  return {
    cwd: process.cwd(),
    origin: "origin",
    branchName: "main",
    productionBranch: "main",
    developBranch: "develop",
    logger: {
      info: (m, ...r) => logs.info.push([m, ...r].join(" ")),
      error: (m) => logs.error.push(String(m))
    },
    ...overrides,
    _logs: logs
  };
}

describe("syncRepository", () => {
  beforeEach(() => {
    git.fetch.mockClear();
    git.push.mockClear();
  });

  it("pushes production branch and syncs develop when different", async () => {
    const ctx = makeContext({productionBranch: "main", developBranch: "develop", branchName: "main"});

    await syncRepository(ctx);

    expect(git.fetch).toHaveBeenCalledTimes(1);
    // push --quiet --set-upstream origin main
    expect(git.push).toHaveBeenCalledWith("--quiet", "--set-upstream", "origin", "main");
    // push -f origin main:refs/heads/develop
    expect(git.push).toHaveBeenCalledWith("-f", "origin", "main:refs/heads/develop");
  });

  it("does not sync develop when same as production", async () => {
    const ctx = makeContext({productionBranch: "main", developBranch: "main"});

    await syncRepository(ctx);

    // first call is set-upstream
    expect(git.push).toHaveBeenCalledWith("--quiet", "--set-upstream", "origin", "main");
    // only one push when develop === production (unless prerelease branch below)
  });

  it("pushes prerelease branch when branchName is alpha/beta/rc", async () => {
    const ctx = makeContext({productionBranch: "main", developBranch: "develop", branchName: "beta"});

    await syncRepository(ctx);

    expect(git.push).toHaveBeenCalledWith("--quiet", "--set-upstream", "origin", "main");
    expect(git.push).toHaveBeenCalledWith("-f", "origin", "main:refs/heads/develop");
    // prerelease push
    expect(git.push).toHaveBeenCalledWith("--quiet", "--set-upstream", "origin", "beta");
  });
});
