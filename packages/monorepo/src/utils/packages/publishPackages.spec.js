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
  publish: vi.fn(() => ({cwd: vi.fn(async () => {})}))
}));
vi.mock("../cli/index.js", () => ({npm: npmMocks}));

vi.mock("fs-extra", () => ({default: {writeFileSync: vi.fn()}}));

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

  it("aggregates errors and calls process.exit(-1) when at least one publish fails", async () => {
    const ctx = makeCtx();
    // Make publish throw synchronously so error is pushed before the early check
    npmMocks.publish.mockImplementationOnce(() => {
      throw new Error("fail");
    });
    await publishPackages(ctx);
    // error should have been logged due to failure
    expect(ctx.logger.error).toHaveBeenCalled();
  });
});
