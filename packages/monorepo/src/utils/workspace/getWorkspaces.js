import get from "lodash/get";

export function getWorkspaces(workspaces, rootPkg) {
  if (workspaces) {
    return workspaces;
  }

  if (get(rootPkg, "monorepo.workspaces")) {
    return get(rootPkg, "monorepo.workspaces");
  }

  const yarnWorkspaces = get(this.rootPkg, "workspaces.packages");
  if (yarnWorkspaces) {
    return yarnWorkspaces;
  }

  const npmWorkspaces = get(rootPkg, "workspaces");
  if (Array.isArray(npmWorkspaces)) {
    return npmWorkspaces;
  }

  return ["packages/*"];
}
