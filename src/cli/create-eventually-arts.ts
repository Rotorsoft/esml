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

const use =
  "Use: npx create-eventually-arts --src=path-to-model --dir=path-to-target";

const { dir, src } = parseArguments(process.argv);
if (!(dir && src)) {
  console.log(use);
  process.exit(1);
}

const srcPath = resolvePath(src);
console.log("Source path:", srcPath);
const dirPath = resolvePath(dir);
console.log("Target path:", dirPath);

const code = loadFile(srcPath);
if (!code) {
  console.error("Model not found at:", srcPath);
  process.exit(1);
}

createDirectory(dirPath);

const model = Grammar.parse(json5.parse(code));
const root = compile(model);
root.nodes.forEach((ctx, name) => {
  const pkg = decamelize(name);
  const cdir = path.join(dirPath, pkg);
  createDirectory(path.join(cdir));
  createDirectory(path.join(cdir, "/schemas"));

  console.log(`Creating artifacts in context ${ctx.name}:`, cdir, "...");
  createArtifacts(ctx as ContextNode, (art, result, schemas) => {
    console.log(`... ${art.visual} ${art.name}`);
    createFile(path.join(cdir, `${art.name}.${art.visual}.ts`), result.content);
    createFile(path.join(cdir, `${art.name}.spec.ts`), result.unitTest);
    Object.entries(schemas.schemas).forEach(([name, content]) =>
      createFile(path.join(cdir, `/schemas/${name}.schema.ts`), content)
    );
    createFile(path.join(cdir, `/schemas/${art.name}.ts`), schemas.map);
  });
});

console.log("Successfully created eventually artifacts 🚀");
