import fs from "fs-extra";
import {dirname} from "path";

export async function writePackage(pkgPath, pkg) {
  fs.ensureDirSync(dirname(pkgPath));
  return fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2), {encoding: "utf8"});
}
