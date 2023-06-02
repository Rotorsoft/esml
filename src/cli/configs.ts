import path from "node:path";
import os from "node:os";
import { createFile } from "./utils";

type Package = {
  name: string;
  version: string;
  description: string;
  author: {
    name: string;
    email: string;
  };
  license: "MIT";
  main?: string;
  workspaces?: string[];
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export function createPackageJson(
  dir: string,
  name: string,
  workspaces?: string[]
): void {
  const username = os.userInfo().username || "username";
  const pkg: Package = {
    name,
    version: "0.1.0",
    description: `Describe your ${name} project here`,
    author: {
      name: username,
      email: `${username}@email.com`,
    },
    license: "MIT",
  };
  if (workspaces) {
    pkg.workspaces = workspaces;
    pkg.scripts = {
      build: "npm run build --workspaces",
      test: "npm run test --workspaces",
      dev: "sh ./scripts/dev.sh",
      up: "npm run build && docker-compose up",
      down: "docker-compose down",
    };
    pkg.devDependencies = {
      "@types/express": "^4",
      "@types/jest": "^29",
      "@types/node": "^18",
      jest: "^29",
      "ts-jest": "^29",
      "ts-node": "^10",
      "ts-node-dev": "^2",
      typescript: "^5",
    };
  } else {
    pkg.main = "dist/index.js";
    pkg.scripts = {
      start: "node dist/index.js",
      test: "jest --coverage",
      build: "tsc",
    };
    pkg.dependencies = {
      "@rotorsoft/eventually": "^5",
      "@rotorsoft/eventually-express": "^5",
      "@rotorsoft/eventually-openapi": "^0",
      "@rotorsoft/eventually-pg": "^5",
      express: "^4",
      zod: "^3",
    };
  }
  createFile(path.join(dir, "package.json"), JSON.stringify(pkg, null, 2));
}

export function createTsConfig(dir: string, base?: string): void {
  const tsConfig = base
    ? {
        extends: base,
        compilerOptions: {
          rootDir: "src",
          outDir: "dist",
        },
        include: ["src"],
        exclude: ["src/__tests__"],
      }
    : {
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
        },
        exclude: ["node_modules"],
      };
  createFile(
    path.join(dir, "tsconfig.json"),
    JSON.stringify(tsConfig, null, 2)
  );
}

export function createJestConfig(dir: string): void {
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
    path.join(dir, "jest.config.js"),
    `/* eslint-disable no-undef */
/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = ${JSON.stringify(jestConfig, null, 2)};
`
  );
}

export function createEnv(dir: string): void {
  createFile(
    path.join(dir, ".env"),
    `LOG_LEVEL=trace
OAS_UI=Rapidoc

# local PG docker container
PG_HOST=localhost
PG_USER=postgres
PG_PASSWORD=postgres
PG_DATABASE=postgres
`
  );
}

export function createGitIgnore(dir: string): void {
  createFile(
    path.join(dir, ".gitignore"),
    `node_modules
dist
coverage
`
  );
}
