import {execaSync} from "execa";
import {npm} from "./Npm.js";

// Mock execa module used by Cli.js so we don't actually spawn processes
vi.mock("execa", () => {
  const execa = vi.fn(() => ({
    stdout: {pipe: vi.fn(() => ({}))},
    stderr: {pipe: vi.fn(() => ({}))}
  }));
  const execaSync = vi.fn(() => ({stdout: "", stderr: ""}));
  return {execa, execaSync};
});

describe("Npm CLI helper", () => {
  beforeEach(() => {
    execaSync.mockClear();
  });

  it("newVersion should call npm version with --no-git-tag-version", () => {
    npm.newVersion("1.2.3");
    expect(execaSync).toHaveBeenCalledTimes(1);
    const [cmd, args, options] = execaSync.mock.calls[0];
    expect(cmd).toBe("npm");
    expect(args).toEqual(["version", "--no-git-tag-version", "1.2.3"]);
    expect(options).toMatchObject({stdio: "inherit"});
  });

  it("run should proxy to npm run <cmd> with args and allow sync()", () => {
    npm.run("test", "--workspaces").sync();
    const [cmd, args] = execaSync.mock.calls.at(-1);
    expect(cmd).toBe("npm");
    expect(args).toEqual(["run", "test", "--workspaces"]);
  });

  it("restore should reinstall without lock and production", () => {
    npm.restore().sync();
    const [cmd, args] = execaSync.mock.calls.at(-1);
    expect(cmd).toBe("npm");
    expect(args).toEqual(["install", "--no-package-lock", "--no-production"]);
  });

  it("install and refreshInstall should call npm install", () => {
    npm.install("--no-audit").sync();
    let [cmd, args] = execaSync.mock.calls.at(-1);
    expect(cmd).toBe("npm");
    expect(args).toEqual(["install", "--no-audit"]);

    npm.refreshInstall().sync();
    [cmd, args] = execaSync.mock.calls.at(-1);
    expect(cmd).toBe("npm");
    expect(args).toEqual(["install"]);
  });
});
