import {execaSync} from "execa";
import {pnpm} from "./Pnpm.js";

// Mock execa module used by Cli.js
vi.mock("execa", () => {
  const execa = vi.fn(() => ({
    stdout: {pipe: vi.fn(() => ({}))},
    stderr: {pipe: vi.fn(() => ({}))}
  }));
  const execaSync = vi.fn(() => ({stdout: "", stderr: ""}));
  return {execa, execaSync};
});

describe("Pnpm CLI helper", () => {
  beforeEach(() => {
    execaSync.mockClear();
  });

  it("version should call pnpm version with provided flags", () => {
    pnpm.version("--no-git-tag-version", "3.4.5");
    const [cmd, args, options] = execaSync.mock.calls.at(-1);
    expect(cmd).toBe("pnpm");
    expect(args).toEqual(["version", "--no-git-tag-version", "3.4.5"]);
    expect(options).toMatchObject({stdio: "inherit"});
  });

  it("run should proxy to pnpm run <cmd> with args and allow sync()", () => {
    pnpm.run("build", "--filter", "./packages/*").sync();
    const [cmd, args] = execaSync.mock.calls.at(-1);
    expect(cmd).toBe("pnpm");
    expect(args).toEqual(["run", "build", "--filter", "./packages/*"]);
  });

  it("restore should reinstall with frozen lockfile and include dev deps", () => {
    pnpm.restore().sync();
    const [cmd, args] = execaSync.mock.calls.at(-1);
    expect(cmd).toBe("pnpm");
    expect(args).toEqual(["install", "--frozen-lockfile", "--prod=false"]);
  });

  it("install and refreshInstall should call pnpm install", () => {
    pnpm.install("--ignore-scripts").sync();
    let [cmd, args] = execaSync.mock.calls.at(-1);
    expect(cmd).toBe("pnpm");
    expect(args).toEqual(["install", "--ignore-scripts"]);

    pnpm.refreshInstall().sync();
    [cmd, args] = execaSync.mock.calls.at(-1);
    expect(cmd).toBe("pnpm");
    expect(args).toEqual(["install"]);
  });
});
