import {copyPackages} from "./copyPackages.js";

// mock findPackages to return one package entry
vi.mock("./findPackages.js", () => ({
  findPackages: vi.fn(async () => [{path: "/repo/packages/a/package.json", distPath: "/repo/dist/@scope/a"}])
}));

// mock fs for existsSync/readFileSync
vi.mock("fs", () => ({
  existsSync: vi.fn((p) => p === "/repo/packages/a/.npmignore" || p === "/repo/packages/a"),
  readFileSync: vi.fn(() => "ignored.txt\nsubdir/*\n")
}));

const copyCalls = [];
vi.mock("../common/copy.js", () => ({
  copy: vi.fn(async (patterns, opts) => copyCalls.push({patterns, opts}))
}));

describe("copyPackages", () => {
  beforeEach(() => {
    copyCalls.length = 0;
  });

  it("builds patterns including .npmignore negations and calls copy with base/output", async () => {
    await copyPackages({});

    expect(copyCalls.length).toBe(1);
    const {patterns, opts} = copyCalls[0];

    // default patterns should include wildcards and !node_modules/**
    expect(patterns).toContain("*");
    expect(patterns).toContain("!node_modules/**");
    // from .npmignore we convert lines to !<pattern>
    expect(patterns).toContain("!ignored.txt");
    expect(patterns).toContain("!subdir/*");

    expect(opts.baseDir).toBe("/repo/packages/a");
    expect(opts.outputDir).toBe("/repo/dist/@scope/a");
  });
});
