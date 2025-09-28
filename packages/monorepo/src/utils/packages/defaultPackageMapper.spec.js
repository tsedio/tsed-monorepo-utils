import {defaultPackageMapper} from "./defaultPackageMapper.js";

function makeRootPkg(repo) {
  return {
    name: "@scope/root",
    version: "1.0.0",
    repository: repo,
    bugs: {url: "https://github.com/org/repo/issues"},
    author: "Alice",
    license: "MIT",
    gitHead: "abc123",
    contributors: ["Bob"]
  };
}

describe("defaultPackageMapper", () => {
  it("normalizes repository, builds homepage, rewrites main/typings, and copies meta fields", () => {
    const rootPkg = makeRootPkg({url: "git://github.com/org/repo.git"});
    const context = {
      productionBranch: "main",
      rootPkg,
      rootDir: "/repo"
    };

    const pkgInfo = {
      name: "@scope/a",
      path: "/repo/packages/a/package.json",
      pkg: {name: "@scope/a", main: "src/index.ts", typings: "src/index.ts"}
    };

    const out = defaultPackageMapper(pkgInfo, context);

    // repository should replace git:// and drop .git
    expect(out.repository).toBe("https://github.com/org/repo");
    // homepage should point to tree/main with package relative path
    expect(out.homepage).toBe("https://github.com/org/repo/tree/main/packages/a");

    // main .ts -> .js, typings .ts -> .d.ts
    expect(out.main).toBe("src/index.js");
    expect(out.typings).toBe("src/index.d.ts");

    // copies metadata
    expect(out.bugs).toEqual(rootPkg.bugs);
    expect(out.author).toBe("Alice");
    expect(out.license).toBe("MIT");
    expect(out.gitHead).toBe("abc123");
    expect(out.contributors).toEqual(["Bob"]);
  });

  it("leaves typings ending with .d.ts unchanged and preserves main when not .ts", () => {
    const rootPkg = makeRootPkg("https://github.com/org/repo.git");
    const context = {productionBranch: "develop", rootPkg, rootDir: "/repo"};
    const pkgInfo = {
      name: "@scope/b",
      path: "/repo/packages/b/package.json",
      pkg: {name: "@scope/b", main: "lib/index.js", typings: "types/index.d.ts"}
    };

    const out = defaultPackageMapper(pkgInfo, context);

    expect(out.main).toBe("lib/index.js");
    expect(out.typings).toBe("types/index.d.ts");
    // homepage uses branch and relative path
    expect(out.homepage).toBe("https://github.com/org/repo/tree/develop/packages/b");
  });
});
