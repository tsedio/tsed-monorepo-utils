import {findPackages} from "./findPackages.js";

vi.mock("../common/glob.js", () => ({
  globAsync: vi.fn(async (patterns, {cwd}) => [
    `${cwd}/packages/a/package.json`,
    `${cwd}/packages/b/package.json`,
    `${cwd}/packages/c/package.json`
  ])
}));

vi.mock("./readPackage.js", () => ({
  readPackage: vi.fn((file) => {
    if (file.includes("/a/")) {
      return {name: "@scope/a", version: "1.0.0", dependencies: {"@scope/b": "^2.0.0"}};
    }
    if (file.includes("/b/")) {
      return {name: "@scope/b", version: "2.0.0"};
    }
    if (file.includes("/c/")) {
      return {name: "@scope/c", version: "3.0.0", devDependencies: {"@scope/a": "^1.0.0"}};
    }
    return {name: "unknown", version: "0.0.0"};
  })
}));

function makeContext() {
  return {
    cwd: "/repo",
    rootDir: "/repo",
    outputDir: "dist",
    workspaces: ["packages/*"]
  };
}

describe("findPackages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns packages ordered by dependency graph", async () => {
    const ctx = makeContext();
    const list = await findPackages(ctx);

    // Expect that b is listed before a, and a before c due to deps resolution
    const names = list.map((p) => p.pkg.name);
    expect(names.indexOf("@scope/b")).toBeLessThan(names.indexOf("@scope/a"));
    expect(names.indexOf("@scope/a")).toBeLessThan(names.indexOf("@scope/c"));

    // distPath is computed from context
    const itemA = list.find((p) => p.pkg.name === "@scope/a");
    expect(itemA.distPath).toBe("/repo/dist/@scope/a");
  });
});
