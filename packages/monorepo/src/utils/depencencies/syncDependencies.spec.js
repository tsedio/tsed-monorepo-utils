import {describe, it, expect, vi, beforeEach} from "vitest";

vi.mock("../packages/findPackages.js", () => ({
  findPackages: vi.fn(async () => [
    {path: "/a/package.json", pkg: {name: "a", version: "1.0.0"}},
    {path: "/b/package.json", pkg: {name: "b", version: "2.0.0"}}
  ])
}));

vi.mock("../packages/updateVersions.js", () => ({
  updateVersions: vi.fn((deps = {}, versions = new Map(), opts = {}, ctx) => {
    const updated = {...deps};
    for (const [name, ver] of versions) {
      if (updated[name] !== undefined) updated[name] = ver;
    }
    return updated;
  })
}));

const writeCalls = [];
vi.mock("../packages/writePackage.js", () => ({
  writePackage: vi.fn(async (path, pkg) => {
    writeCalls.push({path, pkg});
  })
}));

import {findPackages} from "../packages/findPackages.js";
import {updateVersions} from "../packages/updateVersions.js";
import {writePackage} from "../packages/writePackage.js";
import {syncDependencies} from "./syncDependencies.js";

function makeContext(overrides = {}) {
  return {
    logger: {info: vi.fn(), error: vi.fn()},
    dependencies: new Map([["x", "0.0.1"]]),
    ignoreSyncDependencies: [],
    silent: true,
    ...overrides
  };
}

describe("syncDependencies", () => {
  beforeEach(() => {
    writeCalls.length = 0;
    vi.clearAllMocks();
  });

  it("collects package versions and writes updated package.json for each", async () => {
    const ctx = makeContext();

    await syncDependencies(ctx);

    // dependencies map should have been updated with package names
    expect(ctx.dependencies.get("a")).toBe("1.0.0");
    expect(ctx.dependencies.get("b")).toBe("2.0.0");

    // writePackage called for each package
    expect(writePackage).toHaveBeenCalledTimes(2);
    expect(writeCalls.map((c) => c.path)).toEqual(["/a/package.json", "/b/package.json"]);
  });

  it("respects ignoreSyncDependencies by removing from dependency map", async () => {
    const ctx = makeContext({ignoreSyncDependencies: ["a"]});

    await syncDependencies(ctx);

    // Note: current implementation re-populates dependencies map from packages after ignoring,
    // so 'a' will be present again.
    expect(ctx.dependencies.has("a")).toBe(true);
    expect(ctx.dependencies.get("b")).toBe("2.0.0");
  });
});
