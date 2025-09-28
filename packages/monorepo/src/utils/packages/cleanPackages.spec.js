import {cleanPackages} from "./cleanPackages.js";

const packages = [{path: "/repo/packages/a/package.json"}, {path: "/repo/packages/b/package.json"}];

vi.mock("./findPackages.js", () => ({
  findPackages: vi.fn(async () => packages)
}));

const patternsCalled = [];
vi.mock("../common/clean.js", () => ({
  clean: vi.fn(async (patterns) => patternsCalled.push(patterns))
}));

describe("cleanPackages", () => {
  beforeEach(() => {
    patternsCalled.length = 0;
  });

  it("computes patterns for package dirs and root output dir", async () => {
    const ctx = {rootDir: "/repo", outputDir: "dist"};
    await cleanPackages(ctx);

    expect(patternsCalled.length).toBe(1);
    const patterns = patternsCalled[0];

    // includes root outputDir
    expect(patterns).toContain("/repo/dist");
    // includes esm/types/lib/dist for each package base dir
    expect(patterns).toContain("/repo/packages/a/esm");
    expect(patterns).toContain("/repo/packages/a/types");
    expect(patterns).toContain("/repo/packages/a/lib");
    expect(patterns).toContain("/repo/packages/a/dist");

    expect(patterns).toContain("/repo/packages/b/esm");
    expect(patterns).toContain("/repo/packages/b/types");
    expect(patterns).toContain("/repo/packages/b/lib");
    expect(patterns).toContain("/repo/packages/b/dist");
  });
});
