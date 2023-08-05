#!/usr/bin/env node

import json5 from "json5";
import path from "node:path";
import { compile } from "../compiler";
import { Grammar } from "../schema";
import { createArtifacts } from "./generators";
import {
  createDirectory,
  createFile,
  decamelize,
  loadFile,
  parseArguments,
  resolvePath,
} from "./utils";
import { ContextNode } from "../types";

const { dir, src } = parseArguments(process.argv);

if (!src) {
  console.error("Please provide a path to the model --src=path");
  process.exit(1);
}
if (!dir) {
  console.error("Please provide a target directory --dir=path");
  process.exit(1);
}

const base = resolvePath(dir);
console.log("base directory:", base);
const spath = resolvePath(src);
console.log("source path:", spath);

const code = loadFile(spath);
if (!code) {
  console.error("Model not found at:", spath);
  process.exit(1);
}

createDirectory(base);

const model = Grammar.parse(json5.parse(code));
const root = compile(model);
root.nodes.forEach((ctx, name) => {
  const pkg = decamelize(name);
  const cdir = path.join(base, pkg);
  createDirectory(path.join(cdir));
  createDirectory(path.join(cdir, "/schemas"));

  console.log(`Creating artifacts in context ${ctx.name}:`, cdir, "...");
  createArtifacts(ctx as ContextNode, (art, result, schemas) => {
    console.log(`... ${art.name}`);
    createFile(path.join(cdir, `${art.name}.${art.type}.ts`), result.content);
    createFile(path.join(cdir, `${art.name}.spec.ts`), result.unitTest);
    Object.entries(schemas).forEach(([name, content]) =>
      createFile(path.join(cdir, `/schemas/${name}.schema.ts`), content)
    );
  });
});

console.log("Successfully created eventually artifacts 🚀");
