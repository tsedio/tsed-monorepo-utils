import {writePackage} from "./writePackage.js";

const calls = {ensure: [], write: []};

vi.mock("fs-extra", () => ({
  default: {
    ensureDirSync: vi.fn((dir) => calls.ensure.push(dir)),
    writeFile: vi.fn(async (file, content, opts) => calls.write.push({file, content, opts}))
  }
}));

vi.mock("path", async (orig) => {
  const m = await orig();
  return {
    ...m,
    dirname: vi.fn((p) => p.replace(/\/[^/]+$/, ""))
  };
});

describe("writePackage", () => {
  beforeEach(() => {
    calls.ensure.length = 0;
    calls.write.length = 0;
  });

  it("ensures directory and writes stringified JSON with utf8", async () => {
    const path = "/repo/pkg/package.json";
    const pkg = {name: "a", version: "1.0.0"};

    await writePackage(path, pkg);

    expect(calls.ensure[0]).toBe("/repo/pkg");
    expect(calls.write[0].file).toBe(path);
    expect(calls.write[0].content).toBe(JSON.stringify(pkg, null, 2));
    expect(calls.write[0].opts).toEqual({encoding: "utf8"});
  });
});
