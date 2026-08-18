import {
  assertNoUnpublishedNpmPackages,
  bootstrapTrustedPackages,
  getNpmPackageTrustStatus,
  getUnpublishedNpmPackages,
  migrateTrustedPackages
} from "./trustedPublishing.js";

const npmMocks = vi.hoisted(() => ({
  trust: vi.fn(async () => {}),
  view: vi.fn()
}));
const packageMocks = vi.hoisted(() => ({
  findPackages: vi.fn(async () => [
    {distPath: "/repo/dist/existing", pkg: {name: "@scope/existing"}},
    {distPath: "/repo/dist/new", pkg: {name: "@scope/new"}},
    {distPath: "/repo/dist/private", pkg: {name: "@scope/private", private: true}}
  ]),
  publishPackage: vi.fn(async () => {}),
  readPackage: vi.fn(),
  writePackage: vi.fn(async () => {})
}));

vi.mock("../cli/index.js", () => ({npm: npmMocks}));
vi.mock("./publishPackages.js", () => ({publishPackage: packageMocks.publishPackage}));
vi.mock("./readPackage.js", () => ({readPackage: packageMocks.readPackage}));
vi.mock("./writePackage.js", () => ({writePackage: packageMocks.writePackage}));
vi.mock("./findPackages.js", () => ({
  findPackages: packageMocks.findPackages
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

function npmTrustList(result) {
  return {get: vi.fn(result), interactive: vi.fn(result)};
}

describe("trusted publishing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    npmMocks.trust.mockReset();
    packageMocks.findPackages.mockResolvedValue([
      {distPath: "/repo/dist/existing", pkg: {name: "@scope/existing"}},
      {distPath: "/repo/dist/new", pkg: {name: "@scope/new"}},
      {distPath: "/repo/dist/private", pkg: {name: "@scope/private", private: true}}
    ]);
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
    npmMocks.trust.mockResolvedValue();

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

  it("migrates published packages that do not have a trusted publisher", async () => {
    npmMocks.trust.mockImplementation((command, packageName) => {
      if (command === "list") {
        if (packageName === "@scope/new") {
          return npmTrustList(() => {
            throw new Error("npm error code E404 404 Not Found");
          });
        }

        return npmTrustList(() => "[]");
      }

      return Promise.resolve();
    });

    const packages = await migrateTrustedPackages({
      ...makeCtx(),
      logger: {info: vi.fn()},
      repositoryUrl: "https://github.com/owner/repository.git",
      trustedPublishingYes: true
    });

    expect(packages.map(({pkg}) => pkg.name)).toEqual(["@scope/existing"]);
    expect(npmMocks.view).not.toHaveBeenCalled();
    expect(npmMocks.trust).toHaveBeenCalledWith(
      "github",
      "@scope/existing",
      "--repo",
      "owner/repository",
      "--file",
      "build.yml",
      "--allow-publish",
      "--yes"
    );
  });

  it("lists each package trust status", async () => {
    npmMocks.view.mockImplementationOnce(() => npmView(() => "1.0.0"));
    npmMocks.view.mockImplementationOnce(() =>
      npmView(() => {
        throw new Error("npm error code E404 404 Not Found");
      })
    );
    npmMocks.trust.mockImplementation(() => npmTrustList(() => "[]"));

    const statuses = await getNpmPackageTrustStatus(makeCtx());

    expect(statuses.map(({pkg, status}) => [pkg.pkg.name, status])).toEqual([
      ["@scope/existing", "untrusted"],
      ["@scope/new", "unpublished"],
      ["@scope/private", "private"]
    ]);
  });

  it("recognises npm's single trusted publisher response", async () => {
    npmMocks.view.mockImplementationOnce(() => npmView(() => "1.0.0"));
    npmMocks.view.mockImplementationOnce(() =>
      npmView(() => {
        throw new Error("npm error code E404 404 Not Found");
      })
    );
    npmMocks.trust.mockImplementation(() =>
      npmTrustList(() =>
        JSON.stringify({
          id: "aaa80890-69d5-4e5e-993d-cd5217f3b7c5",
          type: "github",
          file: "build.yml",
          repository: "tsedio/tsed-monorepo-utils"
        })
      )
    );

    const statuses = await getNpmPackageTrustStatus(makeCtx());

    expect(statuses.map(({pkg, status}) => [pkg.pkg.name, status])).toEqual([
      ["@scope/existing", "trusted"],
      ["@scope/new", "unpublished"],
      ["@scope/private", "private"]
    ]);
  });

  it("reports authentication-required when npm requires 2FA for trust status access", async () => {
    npmMocks.view.mockImplementationOnce(() => npmView(() => "1.0.0"));
    npmMocks.view.mockImplementationOnce(() =>
      npmView(() => {
        throw new Error("npm error code E404 404 Not Found");
      })
    );
    npmMocks.trust.mockImplementation(() =>
      npmTrustList(() => {
        throw new Error("npm error code EOTP This operation requires a one-time password.");
      })
    );

    const statuses = await getNpmPackageTrustStatus(makeCtx());

    expect(statuses.map(({pkg, status}) => [pkg.pkg.name, status])).toEqual([
      ["@scope/existing", "authentication-required"],
      ["@scope/new", "unpublished"],
      ["@scope/private", "private"]
    ]);
  });

  it("does not repeat npm 2FA requests after authentication is required", async () => {
    packageMocks.findPackages.mockResolvedValue([
      {distPath: "/repo/dist/first", pkg: {name: "@scope/first"}},
      {distPath: "/repo/dist/second", pkg: {name: "@scope/second"}}
    ]);
    npmMocks.view.mockImplementation(() => npmView(() => "1.0.0"));
    const trustList = npmTrustList(() => {
      throw new Error("npm error code EOTP This operation requires a one-time password.");
    });
    npmMocks.trust.mockReturnValue(trustList);

    const statuses = await getNpmPackageTrustStatus(makeCtx());

    expect(statuses.map(({pkg, status}) => [pkg.pkg.name, status])).toEqual([
      ["@scope/first", "authentication-required"],
      ["@scope/second", "authentication-required"]
    ]);
    expect(npmMocks.trust).toHaveBeenCalledTimes(1);
    expect(trustList.interactive).toHaveBeenCalledTimes(1);
    expect(trustList.get).not.toHaveBeenCalled();
  });
});
