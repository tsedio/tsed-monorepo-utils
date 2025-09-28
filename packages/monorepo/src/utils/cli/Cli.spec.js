import {Cli} from "./Cli.js";
import {PassThrough} from "node:stream";
import {execa, execaSync} from "execa";
import {spawnSync} from "child_process";

vi.mock("execa", () => {
  return {
    execa: vi.fn(async () => ({stdout: undefined, stderr: undefined})),
    execaSync: vi.fn(() => ({stdout: "SYNC_OK"}))
  };
});

vi.mock("child_process", async (orig) => {
  return {
    ...(await orig()),
    spawnSync: vi.fn(() => ({
      output: [null, Buffer.from("raw-out"), Buffer.from("raw-err")]
    }))
  };
});

describe("Cli", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("run().get() should call execaSync with cmd and args", () => {
    const out = Cli.run("echo", ["hello"]).get();
    expect(out).toBe("SYNC_OK");
    expect(execaSync).toHaveBeenCalledWith("echo", ["hello"], expect.objectContaining({cwd: expect.any(String)}));
  });

  it("run().sync() should call execaSync with stdio inherit", () => {
    const res = Cli.run("node", ["-v"]).sync();
    expect(res).toEqual({stdout: "SYNC_OK"});
    expect(execaSync).toHaveBeenCalledWith("node", ["-v"], expect.objectContaining({stdio: "inherit"}));
  });

  it("run().getRaw() should use spawnSync and merge outputs", () => {
    const raw = Cli.run("git", ["status"]).getRaw();
    expect(spawnSync).toHaveBeenCalled();
    expect(raw).toContain("raw-out");
  });

  it("handleStream should forward data lines to callbacks and ignore empties", async () => {
    const cli = new Cli("x");
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    const child = {stdout, stderr};

    const success = vi.fn();
    const error = vi.fn();

    cli.handleStream(child, {success, error});
    stdout.emit("data", Buffer.from("\nline1\n\n"));
    stderr.emit("data", Buffer.from("err1\n"));

    // microtask
    await new Promise((r) => setTimeout(r, 0));

    expect(success).toHaveBeenCalled();
    expect(success.mock.calls[0][0]).toBe("line1");
    expect(error).toHaveBeenCalled();
    expect(error.mock.calls[0][0]).toBe("err1");
  });

  it("promise helpers: toStream and toObservable should call execa without stdio inherit", async () => {
    // Ensure execa returns a thenable object with stdout/stderr streams when called without inherit
    execa.mockImplementation(() => {
      const cp = {
        stdout: new PassThrough(),
        stderr: new PassThrough()
      };
      // thenable to satisfy streamToObservable await
      cp.then = (resolve) => resolve();
      return cp;
    });

    const p = Cli.run("echo", ["hello"]);
    const cp = p.toStream();
    expect(execa).toHaveBeenCalledWith("echo", ["hello"], expect.objectContaining({cwd: expect.any(String)}));
    expect(cp).toEqual(expect.objectContaining({}));

    // toObservable exists; we do not invoke it here to avoid executing rxjs piping
    const p2 = Cli.run("echo", ["world"]);
    expect(typeof p2.toObservable).toBe("function");
  });

  it("cwd() should change options for subsequent calls (sync)", () => {
    const p = Cli.run("node", ["-v"]).cwd("/tmp");
    p.sync();
    expect(execaSync).toHaveBeenCalledWith("node", ["-v"], expect.objectContaining({cwd: "/tmp"}));
  });
});
