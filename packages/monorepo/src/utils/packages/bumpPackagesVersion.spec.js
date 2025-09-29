import {bumpPackagesVersion} from "./bumpPackagesVersion.js";

const files = ["/repo/package.json", "/repo/packages/a/package.json", "/repo/packages/b/package.json"];

vi.mock("globby", () => ({globby: vi.fn(async () => files)}));

const pkgs = {
  "/repo/package.json": {name: "@scope/root", version: "0.1.0"},
  "/repo/packages/a/package.json": {
    name: "@scope/a",
    version: "1.0.0",
    dependencies: {"@scope/b": "^2.0.0"},
    peerDependencies: {react: ">=18", "@scope/b": ">=2.0.0"}
  },
  "/repo/packages/b/package.json": {
    name: "@scope/b",
    version: "2.0.0",
    devDependencies: {test: "^1.0.0", "@scope/a": "1.0.0", ext: "workspace:*"}
  }
};

const writeCalls = [];
vi.mock("fs-extra", () => ({
  default: {readJson: vi.fn(async (file) => JSON.parse(JSON.stringify(pkgs[file])))}
}));

vi.mock("./writePackage.js", () => ({
  writePackage: vi.fn(async (file, pkg) => writeCalls.push({file, pkg}))
}));

function ctx() {
  return {workspaces: ["packages/*"], cwd: "/repo"};
}

describe("bumpPackagesVersion", () => {
  beforeEach(() => {
    writeCalls.length = 0;
  });

  it("updates version of all packages and in dependencies/devDependencies; peerDependencies become >=major.0.0; workspace: stays", async () => {
    await bumpPackagesVersion("3.4.5", ctx());

    // ensure each file was written
    const filesWritten = writeCalls.map((c) => c.file).sort();
    expect(filesWritten).toEqual(files.sort());

    const a = writeCalls.find((c) => c.file.includes("/packages/a/package.json")).pkg;
    const b = writeCalls.find((c) => c.file.includes("/packages/b/package.json")).pkg;
    const root = writeCalls.find((c) => c.file === "/repo/package.json").pkg;

    expect(a.version).toBe("3.4.5");
    expect(b.version).toBe("3.4.5");
    expect(root.version).toBe("3.4.5");

    // dep on b should be updated to 3.4.5
    expect(a.dependencies["@scope/b"]).toBe("3.4.5");
    // peer dep on @scope/b should become >=3.0.0 (major preserved)
    expect(a.peerDependencies["@scope/b"]).toBe(">=3.0.0");

    // devDependency on a within b updated, but workspace:* should remain untouched
    expect(b.devDependencies["@scope/a"]).toBe("3.4.5");
    expect(b.devDependencies.ext).toBe("workspace:*");
  });
});
