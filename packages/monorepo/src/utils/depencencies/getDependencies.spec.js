import {join} from "path";
import {readPackage} from "../packages/readPackage.js";
import {getDependencies} from "./getDependencies.js";

// Mock readPackage to control input and observe calls
const readCalls = [];
vi.mock("../packages/readPackage.js", () => ({
  readPackage: vi.fn((path) => {
    readCalls.push(path);
    // default mock package.json
    return {
      name: "pkg",
      version: "0.0.0",
      dependencies: {a: "^1.2.3", b: "2.0.0"},
      devDependencies: {c: "^3.4.5"}
    };
  })
}));

describe("getDependencies", () => {
  beforeEach(() => {
    readCalls.length = 0;
    vi.clearAllMocks();
  });

  it("returns a Map merging deps and devDeps and strips leading ^", () => {
    const map = getDependencies("/repo/pkg.json");

    // readPackage called with provided path
    expect(readPackage).toHaveBeenCalledWith("/repo/pkg.json");

    // Map contents
    expect(map instanceof Map).toBe(true);
    expect(map.get("a")).toBe("1.2.3"); // caret removed
    expect(map.get("b")).toBe("2.0.0");
    expect(map.get("c")).toBe("3.4.5");
  });

  it("uses default cwd package.json when no path is provided", () => {
    // adjust mock to return empty deps to focus on path behavior
    readPackage.mockImplementationOnce((p) => {
      readCalls.push(p);
      return {dependencies: {}, devDependencies: {}};
    });

    const expectedDefault = join(process.cwd(), "package.json");
    const map = getDependencies();

    // called with default path
    expect(readPackage).toHaveBeenCalledWith(expectedDefault);
    expect(map.size).toBe(0);
  });
});
