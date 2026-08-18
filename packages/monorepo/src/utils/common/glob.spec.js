import {describe, expect, it, vi} from "vitest";

const mocks = vi.hoisted(() => ({
  globbySync: vi.fn(() => [".github\\workflows\\build.yml"])
}));

vi.mock("globby", () => ({globby: vi.fn(), globbySync: mocks.globbySync}));

import {globSync} from "./glob.js";

describe("globSync", () => {
  it("uses globby's synchronous ESM export", () => {
    expect(globSync([".github/workflows/*.yml"], {cwd: "/repo"})).toEqual([".github/workflows/build.yml"]);
    expect(mocks.globbySync).toHaveBeenCalledWith([".github/workflows/*.yml"], {cwd: "/repo"});
  });
});
