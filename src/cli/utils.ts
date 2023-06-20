import * as fs from "node:fs";
import { execSync } from "node:child_process";
import { Arguments } from "./types";

export function parseArguments(args: string[]): Arguments {
  const parsedArgs: Arguments = {};

  args.forEach((arg) => {
    const matches = arg.match(/^--([^=]+)=(.*)$/);
    if (matches) {
      const key = matches[1];
      const value = matches[2];
      parsedArgs[key] = value;
    }
  });

  return parsedArgs;
}

export function createDirectory(directory: string): void {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
}

export function createFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content);
}

export function loadFile(filePath: string): string {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath).toString() : "";
}

export function executeCommand(command: string): void {
  execSync(command, { stdio: "inherit" });
}

export function decamelize(value: string): string {
  return value
    .replace(/([\p{Lowercase_Letter}\d])(\p{Uppercase_Letter})/gu, "$1-$2")
    .replace(
      /(\p{Uppercase_Letter}+)(\p{Uppercase_Letter}\p{Lowercase_Letter}+)/gu,
      "$1-$2"
    )
    .toLowerCase();
}
