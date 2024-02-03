import {globby} from "globby";
import normalizePath from "normalize-path";

export function globSync(patterns, options) {
  return globby.sync(patterns, options).map((file) => normalizePath(file));
}

export async function globAsync(patterns, options) {
  const files = await globby(patterns, options);
  return files.map((file) => normalizePath(file));
}
