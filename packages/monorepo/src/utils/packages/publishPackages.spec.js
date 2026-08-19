import {publishPackages} from "./publishPackages.js";

// Place mocks before importing module under test
vi.mock("./findPackages.js", () => ({
  findPackages: vi.fn(async () => [
    {distPath: "/repo/dist/a", pkg: {name: "@scope/a", private: false}},
    {distPath: "/repo/dist/b", pkg: {name: "@scope/b", private: true}}
  ])
}));

const npmMocks = vi.hoisted(() => ({
  pack: vi.fn(() => ({sync: vi.fn(() => ({}))})),
  publish: vi.fn(() => ({cwd: vi.fn(() => ({capture: vi.fn(async () => {})}))}))
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
    ...overrides
  };
}

describe("publishPackages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
});
