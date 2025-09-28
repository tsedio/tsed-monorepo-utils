import {lerna} from "./Lerna.js";
import {Cli} from "./Cli.js";

describe("Lerna CLI", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("newVersion should call lerna version with flags", () => {
    const spy = vi.spyOn(Cli, "run").mockReturnValue({sync: vi.fn()});
    lerna.newVersion("1.0.0");
    expect(spy).toHaveBeenCalledWith("lerna", ["version", "1.0.0", "--exact", "--yes", "--no-git-tag-version", "--no-push"]);
  });

  it("version should call sync version", () => {
    const spy = vi.spyOn(Cli, "run").mockReturnValue({sync: vi.fn()});
    lerna.version("--conventional-commits");
    expect(spy).toHaveBeenCalledWith("lerna", ["version", "--conventional-commits"]);
  });

  it("run should call lerna run with --stream", () => {
    const spy = vi.spyOn(Cli, "run").mockReturnValue({});
    lerna.run("build", "--scope", "pkg");
    expect(spy).toHaveBeenCalledWith("lerna", ["run", "build", "--stream", "--scope", "pkg"]);
  });

  it("runMany should include --concurrency=4 and stream logs", async () => {
    const toStream = vi.fn(() => ({stdout: {on: vi.fn()}, stderr: {on: vi.fn()}}));
    const spy = vi.spyOn(Cli, "run").mockReturnValue({toStream});

    await lerna.runMany("test", ["--since"], {logger: {info: vi.fn(), error: vi.fn()}});

    expect(spy).toHaveBeenCalledWith("lerna", ["run", "test", "--stream", "--concurrency=4", "--since"]);
  });
});
