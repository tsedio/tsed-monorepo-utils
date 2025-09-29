import {newVersion} from "./newVersion.js";

// Mock writePackage to avoid filesystem calls and to capture arguments
const writePkgMock = vi.hoisted(() => ({
  writePackage: vi.fn(async () => {})
}));
vi.mock("./writePackage.js", () => writePkgMock);

describe("newVersion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates rootPkg.version, writes package.json, then runs manager.install", async () => {
    const ctx = {
      version: "2.0.0",
      rootPkg: {name: "@scope/root", version: "1.0.0"},
      manager: {install: vi.fn(async () => {})}
    };

    await newVersion(ctx);

    // rootPkg was updated
    expect(ctx.rootPkg.version).toBe("2.0.0");

    // writePackage called with path and pkg (implementation currently passes the object twice)
    expect(writePkgMock.writePackage).toHaveBeenCalledWith(ctx.rootPkg, ctx.rootPkg);

    // manager.install called with context
    expect(ctx.manager.install).toHaveBeenCalledWith(ctx);
  });
});
