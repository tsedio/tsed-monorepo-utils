import {publishPackages} from "./publishPackages.js";

// Place mocks before importing module under test
vi.mock("./findPackages.js", () => ({
  findPackages: vi.fn(async () => [
    {distPath: "/repo/dist/a", pkg: {name: "@scope/a", version: "1.0.0", private: false}},
    {distPath: "/repo/dist/b", pkg: {name: "@scope/b", version: "1.0.0", private: true}}
  ])
}));

const npmMocks = vi.hoisted(() => ({
  pack: vi.fn(() => ({sync: vi.fn(() => ({}))})),
  publish: vi.fn(() => ({cwd: vi.fn(() => ({capture: vi.fn(async () => {})}))})),
  view: vi.fn(() => ({toStream: vi.fn(async () => ({stdout: ""}))}))
}));
const fsMocks = vi.hoisted(() => ({writeFileSync: vi.fn()}));
vi.mock("../cli/index.js", () => ({npm: npmMocks}));

vi.mock("fs-extra", () => ({default: fsMocks}));

function makeCtx(overrides = {}) {
  return {
    logger: {info: vi.fn(), error: vi.fn()},
    registry: "https://registry.npmjs.org/",
    registries: [],
    npmAccess: "public",
    dryRun: false,
    npmPublishRetryDelay: 0,
    ...overrides
  };
}

describe("publishPackages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function viewReturns(...versions) {
    versions.forEach((stdout) => {
      npmMocks.view.mockImplementationOnce(() => ({toStream: vi.fn(async () => ({stdout}))}));
    });
  }

  function publishFailsWith(stderr) {
    const error = new Error("Command failed with exit code 1");
    error.stderr = stderr;
    npmMocks.publish.mockImplementationOnce(() => ({
      cwd: vi.fn(() => ({
        capture: vi.fn(async () => {
          throw error;
        })
      }))
    }));
  }

  it("publishes non-private packages using npm.publish with userconfig and access", async () => {
    const ctx = makeCtx();
    await publishPackages(ctx);

    expect(npmMocks.publish).toHaveBeenCalledTimes(1);

    // ensure CLI args include --userconfig and --access
    const args = npmMocks.publish.mock.calls[0];
    expect(args[0]).toBe("--userconfig");
    expect(args).toEqual(expect.arrayContaining(["--access", "public", "--registry", ctx.registry]));
  });

  it("performs pack in dryRun mode instead of publish", async () => {
    const ctx = makeCtx({dryRun: true});
    await publishPackages(ctx);
    expect(npmMocks.pack).toHaveBeenCalled();
    expect(npmMocks.publish).not.toHaveBeenCalled();
  });

  it("uses npm trusted publishing without writing an npm token", async () => {
    const ctx = makeCtx({trustedPublishing: true});
    await publishPackages(ctx);

    expect(npmMocks.publish).toHaveBeenCalledTimes(1);
    expect(fsMocks.writeFileSync).toHaveBeenCalledWith(expect.stringContaining(".npmrc"), "", {encoding: "utf8"});
  });

  it("retries with an explicit latest tag when npm rejects the implicit one", async () => {
    const latestError = new Error("Command failed with exit code 1");
    latestError.stderr = 'npm error Cannot implicitly apply the "latest" tag because a newer version exists.';
    const firstPublish = vi.fn(async () => {
      throw latestError;
    });
    const fallbackPublish = vi.fn(async () => {});

    npmMocks.publish
      .mockImplementationOnce(() => ({cwd: vi.fn(() => ({capture: firstPublish}))}))
      .mockImplementationOnce(() => ({cwd: vi.fn(() => ({capture: fallbackPublish}))}));

    await publishPackages(makeCtx());

    expect(npmMocks.publish).toHaveBeenCalledTimes(2);
    expect(npmMocks.publish.mock.calls[1]).toEqual(expect.arrayContaining(["--tag", "latest"]));
    expect(fallbackPublish).toHaveBeenCalled();
  });

  it("fails the release when at least one publish fails", async () => {
    const ctx = makeCtx();
    npmMocks.publish.mockImplementationOnce(() => {
      throw new Error("fail");
    });

    await expect(publishPackages(ctx)).rejects.toThrow("Some packages have not been published");
    expect(ctx.logger.error).toHaveBeenCalled();
  });

  it("skips a package whose version is already published", async () => {
    viewReturns("1.0.0");
    const ctx = makeCtx();

    await publishPackages(ctx);

    expect(npmMocks.view).toHaveBeenCalledWith("@scope/a@1.0.0", "version", "--registry", ctx.registry);
    expect(npmMocks.publish).not.toHaveBeenCalled();
  });

  it("retries a publish that failed on a provenance transparency log error", async () => {
    publishFailsWith("npm error code TLOG_CREATE_ENTRY_ERROR\nnpm error error creating tlog entry - (409)");

    await publishPackages(makeCtx());

    expect(npmMocks.publish).toHaveBeenCalledTimes(2);
  });

  it("stops retrying when the failed attempt actually published the package", async () => {
    viewReturns("", "1.0.0");
    publishFailsWith("npm error code E503");

    await publishPackages(makeCtx());

    expect(npmMocks.publish).toHaveBeenCalledTimes(1);
  });

  it("gives up after the configured number of retries", async () => {
    publishFailsWith("npm error code E429");
    publishFailsWith("npm error code E429");
    publishFailsWith("npm error code E429");

    await expect(publishPackages(makeCtx({npmPublishRetries: 2}))).rejects.toThrow("Some packages have not been published");
    expect(npmMocks.publish).toHaveBeenCalledTimes(3);
  });

  it("does not retry a non transient error", async () => {
    publishFailsWith("npm error code E403\nnpm error 403 Forbidden");

    await expect(publishPackages(makeCtx())).rejects.toThrow("Some packages have not been published");
    expect(npmMocks.publish).toHaveBeenCalledTimes(1);
  });

  it("limits the number of packages published at the same time", async () => {
    const {findPackages} = await import("./findPackages.js");
    findPackages.mockImplementationOnce(async () =>
      Array.from({length: 10}, (_, i) => ({distPath: `/repo/dist/${i}`, pkg: {name: `@scope/p${i}`, version: "1.0.0"}}))
    );
    let running = 0;
    let maxRunning = 0;
    npmMocks.publish.mockImplementation(() => ({
      cwd: vi.fn(() => ({
        capture: vi.fn(async () => {
          running++;
          maxRunning = Math.max(maxRunning, running);
          await new Promise((resolve) => setTimeout(resolve, 5));
          running--;
        })
      }))
    }));

    await publishPackages(makeCtx({npmPublishConcurrency: 3}));

    expect(npmMocks.publish).toHaveBeenCalledTimes(10);
    expect(maxRunning).toBe(3);
  });
});
