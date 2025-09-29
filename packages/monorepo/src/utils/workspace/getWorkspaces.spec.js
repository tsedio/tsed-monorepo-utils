import {getWorkspaces} from "./getWorkspaces.js";

describe("getWorkspaces", () => {
  it("returns provided workspaces param when given", () => {
    const out = getWorkspaces(["modules/*"], {});
    expect(out).toEqual(["modules/*"]);
  });

  it("reads monorepo.workspaces from rootPkg when present", () => {
    const pkg = {monorepo: {workspaces: ["packages/*", "plugins/*"]}};
    const out = getWorkspaces(undefined, pkg);
    expect(out).toEqual(["packages/*", "plugins/*"]);
  });

  it("reads yarn workspaces.packages when present", () => {
    const pkg = {workspaces: {packages: ["pkgs/*"]}};
    const out = getWorkspaces(undefined, pkg);
    expect(out).toEqual(["pkgs/*"]);
  });

  it("reads npm workspaces array when present", () => {
    const pkg = {workspaces: ["scope/*"]};
    const out = getWorkspaces(undefined, pkg);
    expect(out).toEqual(["scope/*"]);
  });

  it("falls back to ['packages/*'] when nothing is configured", () => {
    const out = getWorkspaces(undefined, {});
    expect(out).toEqual(["packages/*"]);
  });
});
