#!/usr/bin/env node

import * as path from "node:path";
import * as os from "node:os";
import {
  createDirectory,
  createFile,
  executeCommand,
  parseArguments,
} from "./utils";
import { generateContent } from "./generators";

const args = parseArguments(process.argv);
if (!args.project) {
  console.error("Please provide a project name using --project=name");
  process.exit(1);
}
const projectDirectory = path.join(process.cwd(), args.project);

function createPackageJson(): void {
  const username = os.userInfo().username || "username";
  const packageJson = {
    name: args.project,
    version: "0.1.0",
    description: `Describe your ${args.project} project here`,
    author: {
      name: username,
      email: `${username}@email.com`,
    },
    license: "MIT",
    main: "dist/index.js",
    scripts: {
      start: "node dist/index.js",
      test: "jest --coverage",
      build: "tsc",
      dev: "ts-node-dev --respawn ./src/index.ts",
    },
    dependencies: {
      "@rotorsoft/eventually": "^5",
      "@rotorsoft/eventually-express": "^5",
      "@rotorsoft/eventually-openapi": "^0",
      "@rotorsoft/eventually-pg": "^5",
      express: "^4",
      zod: "^3",
    },
    devDependencies: {
      "@types/express": "^4",
      "@types/jest": "^29",
      "@types/node": "^18",
      jest: "^29",
      "ts-jest": "^29",
      "ts-node": "^10",
      "ts-node-dev": "^2",
      typescript: "^5",
    },
  };
  createFile(
    path.join(projectDirectory, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );
}

function createTsConfig(): void {
  const tsConfig = {
    compilerOptions: {
      target: "ES2021",
      module: "commonjs",
      strict: true,
      sourceMap: true,
      declaration: true,
      declarationMap: true,
      noImplicitAny: true,
      esModuleInterop: true,
      skipLibCheck: true,
      sourceRoot: "src",
      outDir: "dist",
    },
    exclude: ["node_modules"],
  };
  createFile(
    path.join(projectDirectory, "tsconfig.json"),
    JSON.stringify(tsConfig, null, 2)
  );
}

function createJestConfig(): void {
  const jestConfig = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["**/*spec.ts"],
    coveragePathIgnorePatterns: [
      "node_modules",
      "dist",
      "__tests__",
      "__mocks__",
    ],
  };
  createFile(
    path.join(projectDirectory, "jest.config.js"),
    `/* eslint-disable no-undef */
    /** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
    module.exports = ${JSON.stringify(jestConfig, null, 2)};
    `
  );
}

function createEnv(): void {
  createFile(
    path.join(projectDirectory, ".env"),
    `LOG_LEVEL=trace
OAS_UI=Rapidoc

# local PG docker container
PG_HOST=localhost
PG_USER=postgres
PG_PASSWORD=postgres
PG_DATABASE=postgres`
  );
}

function createGitIgnore(): void {
  createFile(
    path.join(projectDirectory, ".gitignore"),
    `node_modules
dist
coverage`
  );
}

createDirectory(projectDirectory);
createDirectory(path.join(projectDirectory, "src"));
createDirectory(path.join(projectDirectory, "src", "schemas"));
createDirectory(path.join(projectDirectory, "src", "__tests__"));
createDirectory(path.join(projectDirectory, "dist"));
createPackageJson();
createTsConfig();
createJestConfig();
createEnv();
createGitIgnore();
generateContent(projectDirectory, args.project);

executeCommand(`cd ${projectDirectory} && npm install`);
console.log(`Successfully created eventually project '${args.project}' 🚀`);
