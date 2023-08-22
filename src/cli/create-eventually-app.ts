#!/usr/bin/env node

import path from "node:path";
import {
  createDirectory,
  executeCommand,
  loadFile,
  parseArguments,
  resolvePath,
} from "./utils";
import { generateContexts } from "./generators";
import { createEnv, createGitIgnore, createTsConfig } from "./configs";

const use =
  "Use: npx create-eventually-app --src=path-to-model --dir=path-to-target --project=project-name";

const { dir, src, project } = parseArguments(process.argv);
if (!(dir && src && project)) {
  console.log(use);
  process.exit(1);
}

const srcPath = resolvePath(src);
console.log("Source path:", srcPath);
const dirPath = resolvePath(dir);
const projectPath = path.join(dirPath, project);
console.log("Project path:", projectPath);

const code = loadFile(srcPath);
if (!code) {
  console.error("Model not found at:", srcPath);
  process.exit(1);
}

createDirectory(projectPath);
createTsConfig(projectPath);
createEnv(projectPath);
createGitIgnore(projectPath);
generateContexts(projectPath, project, code);
executeCommand(`cd ${projectPath} && npm install`);

console.log(`Successfully created eventually project '${project}' 🚀`);
