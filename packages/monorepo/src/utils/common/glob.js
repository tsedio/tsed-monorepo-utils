import {globby, globbySync} from "globby";
import normalizePath from "normalize-path";

export function globSync(patterns, options) {
  return globbySync(patterns, options).map((file) => normalizePath(file));
}

export async function globAsync(patterns, options) {
  const files = await globby(patterns, options);
  return files.map((file) => normalizePath(file));
}
