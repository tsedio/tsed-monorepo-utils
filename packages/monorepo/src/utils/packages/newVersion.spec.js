import {newVersion} from "./newVersion.js";

const lernaMocks = vi.hoisted(() => ({
  newVersion: vi.fn()
}));
vi.mock("../cli/index.js", () => ({lerna: lernaMocks}));

describe("newVersion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls lerna.newVersion when hasLerna is true and always calls manager.newVersion", async () => {
    const ctx = {
      hasLerna: true,
      version: "2.0.0",
      manager: {newVersion: vi.fn(async () => {})}
    };

    await newVersion(ctx);

    expect(lernaMocks.newVersion).toHaveBeenCalledWith("2.0.0", ctx);
    expect(ctx.manager.newVersion).toHaveBeenCalledWith("2.0.0", ctx);
  });

  it("skips lerna when hasLerna is false but still calls manager.newVersion", async () => {
    const ctx = {
      hasLerna: false,
      version: "1.1.0",
      manager: {newVersion: vi.fn(async () => {})}
    };

    await newVersion(ctx);

    expect(lernaMocks.newVersion).not.toHaveBeenCalled();
    expect(ctx.manager.newVersion).toHaveBeenCalledWith("1.1.0", ctx);
  });
});
