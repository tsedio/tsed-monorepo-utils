import {findPackages} from "./findPackages.js";
import {writePackage} from "./writePackage.js";
import {transformCjsFileToEsm, transformEsmFileToCjs} from "./transformCjsFileToEsm.js";
import {buildHybridPackages, buildHybridPackage} from "./buildHybridPackages.js";

vi.mock("./findPackages.js", () => ({
  findPackages: vi.fn(async () => [
    {
      distPath: "/repo/dist/pkg",
      pkg: {
        name: "@scope/pkg",
        exports: {
          ".": {
            import: "./esm/index.js",
            require: "./cjs/index.js"
          }
        }
      }
    }
  ])
}));

vi.mock("./writePackage.js", () => ({
  writePackage: vi.fn(async () => {})
}));

const transformCalls = {esm: [], cjs: []};

vi.mock("./transformCjsFileToEsm.js", () => ({
  transformCjsFileToEsm: vi.fn(async (dir, ctx) => {
    transformCalls.esm.push(dir);
  }),
  transformEsmFileToCjs: vi.fn(async (dir, ctx) => {
    transformCalls.cjs.push(dir);
  })
}));

const ctx = {silent: true};

describe("buildHybridPackage(s)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transformCalls.esm.length = 0;
    transformCalls.cjs.length = 0;
  });

  it("buildHybridPackage triggers transforms and writes sub package.json files", async () => {
    await buildHybridPackage(
      "/repo/dist/pkg",
      {
        name: "@scope/pkg",
        exports: {".": {import: "./esm/index.js", require: "./cjs/index.js"}}
      },
      ctx
    );

    expect(transformCjsFileToEsm).toHaveBeenCalled();
    expect(transformEsmFileToCjs).toHaveBeenCalled();
    expect(writePackage).toHaveBeenCalledTimes(2);
  });

  it("buildHybridPackages iterates over packages from findPackages", async () => {
    await buildHybridPackages(ctx);

    expect(findPackages).toHaveBeenCalled();
    expect(transformCjsFileToEsm).toHaveBeenCalled();
    expect(transformEsmFileToCjs).toHaveBeenCalled();
  });
});
