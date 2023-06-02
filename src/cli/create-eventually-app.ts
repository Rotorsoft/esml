#!/usr/bin/env node

import path from "node:path";
import { createDirectory, executeCommand, parseArguments } from "./utils";
import { generateContexts } from "./generators";
import { createEnv, createGitIgnore, createTsConfig } from "./configs";

const args = parseArguments(process.argv);
if (!args.project) {
  console.error("Please provide a project name using --project=name");
  process.exit(1);
}
const projectDirectory = path.join(process.cwd(), args.project);
createDirectory(projectDirectory);
createTsConfig(projectDirectory);
createEnv(projectDirectory);
createGitIgnore(projectDirectory);
generateContexts(projectDirectory, args.project);

executeCommand(`cd ${projectDirectory} && npm install`);
console.log(`Successfully created eventually project '${args.project}' 🚀`);
