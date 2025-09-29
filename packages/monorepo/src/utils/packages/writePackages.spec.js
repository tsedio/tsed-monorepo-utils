import {writePackages} from "./writePackages.js";

// Mocks must be declared before importing dependencies used by module under test
vi.mock("./findPackages.js", () => ({
  findPackages: vi.fn(async () => [
    {
      distPath: "/repo/dist/a",
      name: "a",
      path: "/repo/packages/a/package.json",
      pkg: {
        name: "@scope/a",
        version: "1.0.0",
        main: "./src/index.ts",
        dependencies: {"@scope/b": "workspace:*"},
        devDependencies: {"@scope/c": "workspace:*"}
      }
    }
  ])
}));

const writes = [];
vi.mock("./writePackage.js", () => ({
  writePackage: vi.fn(async (file, pkg) => {
    writes.push({file, pkg});
  })
}));

function makeCtx(overrides = {}) {
  return {
    silent: true,
    ignore: [],
    pkgMapper: ({pkg}) => ({...pkg, custom: true}),
    branchName: "beta",
    rootPkg: {version: "2.3.4"},
    ignoreSyncDependencies: [],
    dependencies: new Map(),
    version: "2.3.4",
    ...overrides
  };
}

describe("writePackages", () => {
  beforeEach(() => {
    writes.length = 0;
    vi.clearAllMocks();
  });

  it("applies pkgMapper, sets npmDistTag from prerelease branch, rewrites main/typings and workspace versions, and writes package.json", async () => {
    const ctx = makeCtx();

    await writePackages(ctx);

    expect(writes).toHaveLength(1);
    const {file, pkg} = writes[0];

    // destination path
    expect(file).toBe("/repo/dist/a/package.json");

    // pkgMapper applied
    expect(pkg.custom).toBe(true);

    // npm publishConfig tag from prerelease branch
    expect(pkg.publishConfig.tag).toBe("beta");

    // main rewritten and typings added when pointing to src/index.ts
    expect(pkg.main).toBe("./lib/index.js");
    expect(pkg.typings).toBe("lib/index.d.ts");

    // workspace versions replaced by root version
    expect(pkg.dependencies["@scope/b"]).toBe("2.3.4");
    expect(pkg.devDependencies["@scope/c"]).toBe("2.3.4");
  });

  it("respects explicit npmDistTag in context unless prerelease overrides", async () => {
    const ctx = makeCtx({branchName: "main", npmDistTag: "next"});

    await writePackages(ctx);

    const {pkg} = writes[0];
    expect(pkg.publishConfig.tag).toBe("next");
  });
});
