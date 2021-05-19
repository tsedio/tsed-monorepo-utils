import fs from "fs-extra";
import {globAsync} from "./glob";

export async function copy(patterns, {baseDir, outputDir}) {
  const files = await globAsync(patterns);

  const promises = files.map((file) => fs.copy(file, file.replace(baseDir, outputDir)));

  return Promise.all(promises);
}
