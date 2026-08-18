import {assertNoUnpublishedNpmPackages, bootstrapTrustedPackages, getUnpublishedNpmPackages} from "./trustedPublishing.js";

const npmMocks = vi.hoisted(() => ({
  trust: vi.fn(async () => {}),
  view: vi.fn()
}));
const packageMocks = vi.hoisted(() => ({
  publishPackage: vi.fn(async () => {}),
  readPackage: vi.fn(),
  writePackage: vi.fn(async () => {})
}));

vi.mock("../cli/index.js", () => ({npm: npmMocks}));
vi.mock("./publishPackages.js", () => ({publishPackage: packageMocks.publishPackage}));
vi.mock("./readPackage.js", () => ({readPackage: packageMocks.readPackage}));
vi.mock("./writePackage.js", () => ({writePackage: packageMocks.writePackage}));
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

  it("publishes the bootstrap version before configuring trust", async () => {
    const npmToken = process.env.NPM_TOKEN;
    process.env.NPM_TOKEN = "token";
    npmMocks.view.mockImplementationOnce(() => npmView(() => "1.0.0"));
    npmMocks.view.mockImplementationOnce(() =>
      npmView(() => {
        throw new Error("npm error code E404 404 Not Found");
      })
    );
    packageMocks.readPackage.mockReturnValue({name: "@scope/new", version: "1.2.3"});

    await bootstrapTrustedPackages({...makeCtx(), repositoryUrl: "https://github.com/owner/repository.git"});

    expect(packageMocks.writePackage).toHaveBeenNthCalledWith(
      1,
      "/repo/dist/new/package.json",
      expect.objectContaining({version: "0.0.1"})
    );
    expect(packageMocks.publishPackage).toHaveBeenCalledTimes(1);
    expect(npmMocks.trust).toHaveBeenCalledWith(
      "github",
      "@scope/new",
      "--repo",
      "owner/repository",
      "--file",
      "build.yml",
      "--allow-publish"
    );
    expect(packageMocks.writePackage).toHaveBeenLastCalledWith("/repo/dist/new/package.json", {name: "@scope/new", version: "1.2.3"});

    process.env.NPM_TOKEN = npmToken;
  });
});
