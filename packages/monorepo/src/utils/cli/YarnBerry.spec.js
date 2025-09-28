import {yarnBerry} from "./YarnBerry.js";
import {Cli} from "./Cli.js";
import {bumpPackagesVersion} from "../packages/bumpPackagesVersion.js";

vi.mock("../packages/bumpPackagesVersion.js", () => ({
  bumpPackagesVersion: vi.fn(async () => "BUMPED")
}));

describe("YarnBerry CLI", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("newVersion should delegate to bumpPackagesVersion", async () => {
    const res = await yarnBerry.newVersion("2.0.0", {some: "ctx"});
    expect(bumpPackagesVersion).toHaveBeenCalledWith("2.0.0", {some: "ctx"});
    expect(res).toBe("BUMPED");
  });

  it("version should call sync version", () => {
    const spy = vi.spyOn(Cli, "run").mockReturnValue({sync: vi.fn()});
    yarnBerry.version("--json");
    expect(spy).toHaveBeenCalledWith("yarn", ["version", "--json"]);
  });

  it("runMany should use yarn workspaces foreach run", async () => {
    const streamMock = {toStream: vi.fn(() => ({stdout: {on: vi.fn()}, stderr: {on: vi.fn()}}))};
    const spy = vi.spyOn(Cli, "run").mockReturnValue(streamMock);
    await yarnBerry.runMany("build", ["--arg"], {logger: {info: vi.fn(), error: vi.fn()}});
    expect(spy).toHaveBeenCalledWith("yarn", ["workspaces", "foreach", "-A", "run", "build", "--arg"]);
  });

  it("install/refreshInstall/restore should call expected flags", () => {
    const spy = vi.spyOn(Cli, "run").mockReturnValue({});
    yarnBerry.install("--immutable-cache");
    expect(spy).toHaveBeenCalledWith("yarn", ["install", "--immutable-cache"]);

    yarnBerry.refreshInstall();
    expect(spy).toHaveBeenCalledWith("yarn", ["install", "--refresh-lockfile"]);

    yarnBerry.restore();
    expect(spy).toHaveBeenCalledWith("yarn", ["install", "--immutable"]);
  });
});
