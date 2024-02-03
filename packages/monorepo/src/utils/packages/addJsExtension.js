import {parse} from "@typescript-eslint/typescript-estree";
import {readdirSync, statSync} from "node:fs";
import {writeFile, readFile} from "node:fs/promises";
import logger from "fancy-log";
import {extname} from "path";

function getAllJavaScriptFiles(dir) {
  return readdirSync(dir).flatMap((file) => {
    const path = `${dir}/${file}`;

    if (statSync(path).isDirectory()) {
      return getAllJavaScriptFiles(path);
    }

    const extension = extname(path);

    return extension && extension === ".js" ? [path] : [];
  });
}

function getAllJavaScriptCodes(files) {
  return files.map(async (file) => {
    const code = await readFile(file, {encoding: "utf8"});

    return {
      file,
      code,
      ast: parse(code, {loc: true})
    };
  });
}

function addExtension({ast: {body}, code, file}) {
  const codeWithoutCarriageReturn = code.replace(/\r/gm, "");
  const splitted = codeWithoutCarriageReturn.split("\n");

  const replaceNodes = body.flatMap((statement) => {
    const {type} = statement;
    switch (type) {
      case "ExportAllDeclaration":
      case "ExportNamedDeclaration":
      case "ImportDeclaration": {
        const {source} = statement;
        if (!source) {
          return [];
        }
        const {
          value,
          loc: {end}
        } = source;

        if (value.charAt(0) === ".") {
          const oldCode = splitted[end.line - 1];

          if (!oldCode) {
            throw new Error(`Old Code: ${oldCode} is undefined`);
          }

          if (!value.includes(".js")) {
            return [
              {
                oldCode,
                newCode: oldCode.replace(value, `${value}.js`)
              }
            ];
          }
        }
      }
    }
    return [];
  });

  return [
    {
      code: replaceNodes.length
        ? replaceNodes.reduce((prev, {oldCode, newCode}) => prev.replace(oldCode, newCode), codeWithoutCarriageReturn)
        : codeWithoutCarriageReturn,
      file
    }
  ];
}

export async function addJsExtension(dir, context) {
  const files = getAllJavaScriptFiles(dir);

  if (files.length === 0) {
    return;
  }

  const tasks = await getAllJavaScriptCodes(files).reduce(async (prev, curr) => (await prev).concat(await curr), Promise.resolve([]));

  await Promise.all(
    tasks
      .flatMap((t) => addExtension(t))
      .map(async ({code, file}) => {
        try {
          await writeFile(file, code, {encoding: "utf8"});
        } catch (er) {
          !context.silent && logger.warn(er);
        }
      })
  );
}
