import fs from "fs-extra";
import {dirname} from "path";

export async function writePackage(pkgPath, pkg) {
  fs.ensureDirSync(dirname(pkgPath));
  return fs.writeJson(pkgPath, pkg, {space: 2});
}
