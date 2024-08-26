import {parse} from "@typescript-eslint/typescript-estree";
import {readdirSync, statSync} from "node:fs";
import {readFile, writeFile} from "node:fs/promises";
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

function transform({ast: {body}, code, file}) {
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

  const newCode = replaceNodes.length
    ? replaceNodes.reduce((prev, {oldCode, newCode}) => prev.replace(oldCode, newCode), codeWithoutCarriageReturn)
    : codeWithoutCarriageReturn;

  return [
    {
      code: newCode,
      file
    }
  ];
}

export async function transformCjsFileToEsm(dir, context) {
  const files = getAllJavaScriptFiles(dir);

  if (files.length === 0) {
    return;
  }

  const tasks = await getAllJavaScriptCodes(files).reduce(async (prev, curr) => (await prev).concat(await curr), Promise.resolve([]));

  await Promise.all(
    tasks
      .flatMap((t) => transform(t))
      .map(({code, file}) => {
        return {
          code: code.replace(/__dirname/g, "import.meta.dirname").replace(/require\.resolve/g, "import.meta.resolve"),
          file
        };
      })
      .map(async ({code, file}) => {
        try {
          await writeFile(context?.out ? file + ".mjs" : file, code, {encoding: "utf8"});
        } catch (er) {
          !context.silent && logger.warn(er);
        }
      })
  );
}

export async function transformEsmFileToCjs(dir, context) {
  const files = getAllJavaScriptFiles(dir);

  if (files.length === 0) {
    return;
  }

  const tasks = await getAllJavaScriptCodes(files).reduce(async (prev, curr) => (await prev).concat(await curr), Promise.resolve([]));

  await Promise.all(
    tasks
      .flatMap((t) => transform(t))
      .map(({code, file}) => {
        return {
          code: code
            .replace(/import\.meta\.dirname/g, "__dirname")
            .replace(/import\.meta\.resolve/g, "require.resolve")
            .replace(/await import\("@tsed\//g, 'await require("@tsed/"'),
          file
        };
      })
      .map(async ({code, file}) => {
        try {
          await writeFile(context?.out ? file + ".cjs" : file, code, {encoding: "utf8"});
        } catch (er) {
          !context.silent && logger.warn(er);
        }
      })
  );
}
