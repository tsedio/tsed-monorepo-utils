import fs from "fs-extra";

export async function writePackage(pkgPath, pkg) {
  return fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2), {encoding: "utf8"});
}
