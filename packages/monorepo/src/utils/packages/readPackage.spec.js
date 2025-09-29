import {readPackage} from "./readPackage.js";

vi.mock("fs", () => ({
  readFileSync: vi.fn(() => '{"name":"pkg","version":"1.0.0"}')
}));

describe("readPackage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads and parses JSON from given path", () => {
    const pkg = readPackage("/repo/package.json");
    expect(pkg).toEqual({name: "pkg", version: "1.0.0"});
  });

  it("uses default ./package.json when no path provided", async () => {
    const {readFileSync} = await import("fs");
    readFileSync.mockImplementationOnce(() => '{"name":"default","version":"0.0.0"}');

    const pkg = readPackage();
    expect(pkg).toEqual({name: "default", version: "0.0.0"});
  });
});
