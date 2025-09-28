import {yarn} from "./Yarn.js";
import {Cli} from "./Cli.js";

describe("Yarn CLI", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("newVersion should call yarn version with flags", () => {
    const spy = vi.spyOn(Cli, "run").mockReturnValue({sync: vi.fn()});
    yarn.newVersion("1.2.3");
    expect(spy).toHaveBeenCalledWith("yarn", ["version", "--no-git-tag-version", "--new-version", "1.2.3"]);
  });

  it("version should call sync version", () => {
    const spy = vi.spyOn(Cli, "run").mockReturnValue({sync: vi.fn()});
    yarn.version("arg1");
    expect(spy).toHaveBeenCalledWith("yarn", ["version", "arg1"]);
  });

  it("run should forward args directly", () => {
    const spy = vi.spyOn(Cli, "run").mockReturnValue({});
    yarn.run("build", "-w");
    expect(spy).toHaveBeenCalledWith("yarn", ["build", "-w"]);
  });

  it("install/refreshInstall/restore should call expected flags", () => {
    const spy = vi.spyOn(Cli, "run").mockReturnValue({});
    yarn.install("--check-files");
    expect(spy).toHaveBeenCalledWith("yarn", ["install", "--check-files"]);

    yarn.refreshInstall();
    expect(spy).toHaveBeenCalledWith("yarn", ["install"]);

    yarn.restore();
    expect(spy).toHaveBeenCalledWith("yarn", ["install", "--frozen-lockfile", "--production=false"]);
  });
});
