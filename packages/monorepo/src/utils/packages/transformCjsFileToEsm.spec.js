import {beforeEach, describe, expect, it, vi} from "vitest";
import {readFile} from "node:fs/promises";
import {transformCjsFileToEsm, transformEsmFileToCjs} from "./transformCjsFileToEsm.js";

// We will mock fs interactions used by transform modules
const filesContent = new Map();

vi.mock("node:fs", () => ({
  readdirSync: vi.fn((dir) => {
    // pretend each dir contains a single index.js
    return ["index.js"];
  }),
  statSync: vi.fn(() => ({isDirectory: () => false}))
}));

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(async (file) => filesContent.get(file) || ""),
  writeFile: vi.fn(async (file, code) => {
    filesContent.set(file, code);
  })
}));

describe("transformCjsFileToEsm / transformEsmFileToCjs", () => {
  beforeEach(() => {
    filesContent.clear();
    vi.clearAllMocks();
  });

  it("adds .js extension to relative imports/exports and swaps __dirname/require.resolve to ESM", async () => {
    const dir = "/repo/dist/esm";
    const sourceFile = `${dir}/index.js`;
    const src = [
      "import x from './foo';",
      "export {y} from './bar';",
      "export * from './baz';",
      "console.log(__dirname);",
      "require.resolve('mod')"
    ].join("\n");

    filesContent.set(sourceFile, src);

    await transformCjsFileToEsm(dir, {silent: true});

    const out = await readFile(sourceFile, "utf8");
    expect(out).toContain("import x from './foo.js'");
    expect(out).toContain("export {y} from './bar.js'");
    expect(out).toContain("export * from './baz.js'");
    expect(out).toContain("import.meta.dirname");
    expect(out).toContain("import.meta.resolve");
  });

  it("reverts ESM markers back to CJS in transformEsmFileToCjs", async () => {
    const dir = "/repo/dist/cjs";
    const sourceFile = `${dir}/index.js`;
    const src = [
      "import x from './foo.js';",
      "console.log(import.meta.dirname);",
      "import.meta.resolve('mod')",
      'await import("@tsed/common")'
    ].join("\n");

    filesContent.set(sourceFile, src);

    await transformEsmFileToCjs(dir, {silent: true});

    const out = await readFile(sourceFile, "utf8");
    expect(out).toContain("__dirname");
    expect(out).toContain("require.resolve");
    expect(out).toContain('await require("@tsed/common")');
  });
});
