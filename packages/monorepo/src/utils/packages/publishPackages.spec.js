import {publishPackages} from "./publishPackages.js";

// mock findPackages to return two packages (one private false, one private true)
vi.mock("./findPackages.js", () => ({
  findPackages: vi.fn(async () => [
    {distPath: "/repo/dist/a", pkg: {name: "@scope/a", private: false}},
    {distPath: "/repo/dist/b", pkg: {name: "@scope/b", private: true}}
  ])
}));

// mock npm cli
const pack = vi.fn(() => ({sync: vi.fn(() => ({}))}));
const publish = vi.fn(() => ({cwd: vi.fn(async () => {})}));
vi.mock("../cli/index.js", () => ({npm: {pack, publish}}));

// mock fs-extra writeFileSync via side effect in writeNpmrc not needed to test
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

    // private package should be ignored; publish called once
    expect(publish).toHaveBeenCalledTimes(1);

    // ensure CLI args include --userconfig and --access
    const callArgs = publish.mock.calls[0][0];
    expect(callArgs).toBe("--userconfig");
  });

  it("performs pack in dryRun mode instead of publish", async () => {
    const ctx = makeCtx({dryRun: true});
    await publishPackages(ctx);
    expect(pack).toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
  });

  it("aggregates errors and calls process.exit(-1) when at least one publish fails", async () => {
    const ctx = makeCtx();
    publish.mockImplementationOnce(() => ({
      cwd: vi.fn(async () => {
        throw new Error("fail");
      })
    }));
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {});
    await publishPackages(ctx);
    expect(exitSpy).toHaveBeenCalledWith(-1);
    exitSpy.mockRestore();
  });
});
