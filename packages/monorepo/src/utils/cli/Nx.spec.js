import {nx} from "./Nx.js";
import {Cli} from "./Cli.js";

describe("Nx CLI", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("run should forward to Cli.run", () => {
    const spy = vi.spyOn(Cli, "run").mockReturnValue({});
    nx.run("build", "app");
    expect(spy).toHaveBeenCalledWith("nx", ["build", "app"]);
  });

  it("runMany should use run-many with target", async () => {
    const toStream = vi.fn(() => ({stdout: {on: vi.fn()}, stderr: {on: vi.fn()}}));
    const spy = vi.spyOn(Cli, "run").mockReturnValue({toStream});
    await nx.runMany("test", ["--all"], {logger: {info: vi.fn(), error: vi.fn()}});
    expect(spy).toHaveBeenCalledWith("nx", ["run-many", "--target=test", "--all"]);
  });

  it("install should call Cli.run install", () => {
    const spy = vi.spyOn(Cli, "run").mockReturnValue({});
    nx.install("--frozen-lockfile");
    expect(spy).toHaveBeenCalledWith("nx", ["install", "--frozen-lockfile"]);
  });
});
