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

const { project, dir, src } = parseArguments(process.argv);
if (!project) {
  console.error("Please provide a project name using --project=name");
  process.exit(1);
}

const base = resolvePath(dir);
console.log("base directory:", base);
const pdir = path.join(base, project);
console.log("project directory:", pdir);
const spath = src ? resolvePath(src) : path.join(base, `${project}.json5`);
console.log("source path:", spath);

const code = loadFile(spath);
if (!code) {
  console.error("Model not found at:", spath);
  process.exit(1);
}

createDirectory(pdir);
createTsConfig(pdir);
createEnv(pdir);
createGitIgnore(pdir);
generateContexts(pdir, project, code);
executeCommand(`cd ${pdir} && npm install`);

console.log(`Successfully created eventually project '${project}' 🚀`);
