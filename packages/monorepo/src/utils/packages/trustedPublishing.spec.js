import {assertNoUnpublishedNpmPackages, getUnpublishedNpmPackages} from "./trustedPublishing.js";

const npmMocks = vi.hoisted(() => ({
  view: vi.fn()
}));

vi.mock("../cli/index.js", () => ({npm: npmMocks}));
vi.mock("./findPackages.js", () => ({
  findPackages: vi.fn(async () => [
    {distPath: "/repo/dist/existing", pkg: {name: "@scope/existing"}},
    {distPath: "/repo/dist/new", pkg: {name: "@scope/new"}},
    {distPath: "/repo/dist/private", pkg: {name: "@scope/private", private: true}}
  ])
}));

function makeCtx() {
  return {
    registry: "https://registry.npmjs.org/",
    registries: []
  };
}

function npmView(result) {
  return {get: vi.fn(result)};
}

describe("trusted publishing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists public packages that do not exist on npm", async () => {
    npmMocks.view.mockImplementationOnce(() => npmView(() => "1.0.0"));
    npmMocks.view.mockImplementationOnce(() =>
      npmView(() => {
        throw new Error("npm error code E404 404 Not Found");
      })
    );

    const packages = await getUnpublishedNpmPackages(makeCtx());

    expect(packages.map(({pkg}) => pkg.name)).toEqual(["@scope/new"]);
    expect(npmMocks.view).toHaveBeenCalledTimes(2);
  });

  it("fails the release check when packages have not been bootstrapped", async () => {
    npmMocks.view.mockImplementation(() =>
      npmView(() => {
        throw new Error("npm error code E404 404 Not Found");
      })
    );

    await expect(assertNoUnpublishedNpmPackages(makeCtx())).rejects.toThrow('Run "monorepo trust bootstrap" locally before releasing.');
  });

  it("does not hide npm registry errors", async () => {
    npmMocks.view.mockImplementation(() =>
      npmView(() => {
        throw new Error("npm error code E401 Unauthorized");
      })
    );

    await expect(getUnpublishedNpmPackages(makeCtx())).rejects.toThrow("E401");
  });
});
