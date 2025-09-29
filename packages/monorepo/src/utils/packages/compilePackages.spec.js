import {compilePackages} from "./compilePackages.js";

describe("compilePackages", () => {
  it("delegates to workspaceManager.runMany with buildCmd", async () => {
    const runMany = vi.fn(async () => {});
    const ctx = {buildCmd: "build", workspaceManager: {runMany}};
    await compilePackages(ctx);
    expect(runMany).toHaveBeenCalledWith("build", [], ctx);
  });
});
