#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

function createDirectory(directory: string): void {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
}

function createFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content);
}

function executeCommand(command: string): void {
  execSync(command, { stdio: "inherit" });
}

function createPackageJson(
  projectDirectory: string,
  projectName: string
): void {
  const packageJson = {
    name: projectName,
    version: "1.0.0",
    scripts: {
      start: "node dist/index.js",
      build: "tsc",
      dev: "ts-node-dev --respawn --transpileOnly src/index.ts",
    },
    devDependencies: {
      typescript: "^4.4.3",
      "ts-node-dev": "^1.1.8",
    },
  };

  createFile(
    path.join(projectDirectory, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );
}

function createTsConfig(projectDirectory: string): void {
  const tsConfig = {
    compilerOptions: {
      target: "ES2020",
      module: "commonjs",
      strict: true,
      outDir: "./dist",
    },
    exclude: ["node_modules"],
  };

  createFile(
    path.join(projectDirectory, "tsconfig.json"),
    JSON.stringify(tsConfig, null, 2)
  );
}

function createIndexFile(projectDirectory: string): void {
  const indexContent = `
    console.log('Hello, TypeScript!');
  `;

  createFile(path.join(projectDirectory, "src/index.ts"), indexContent);
}

function createProjectStructure(
  projectDirectory: string,
  projectName: string
): void {
  createDirectory(projectDirectory);
  createDirectory(path.join(projectDirectory, "src"));
  createPackageJson(projectDirectory, projectName);
  createTsConfig(projectDirectory);
  createIndexFile(projectDirectory);
}

function installDependencies(projectDirectory: string): void {
  executeCommand(`cd ${projectDirectory} && npm install`);
}

function main(): void {
  const projectName = process.argv[2];
  if (!projectName) {
    console.error("Please provide a project name.");
    return;
  }
  const projectDirectory = path.join(process.cwd(), projectName);

  createProjectStructure(projectDirectory, projectName);
  installDependencies(projectDirectory);

  console.log(`Successfully created TS project '${projectName}'.`);
}

main();
