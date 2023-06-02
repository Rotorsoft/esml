import path from "node:path";
import { createDirectory, createFile } from "./utils";

const devScript = `#!/bin/bash
set -e

if [ $# -eq 0 ]; then
    echo "Missing service name!"
    echo "Usage: npm run dev service-name [port]"
    exit 1
fi;

readonly service="$1"
readonly target="./packages/$\{service\}"

if [ ! -d $target ]; then
    echo "Invalid service name: $\{service\}"
    exit 1
fi;

readonly port="$2"

echo ">>> Loading [.env] variables..."
set -o allexport
# shellcheck source=/dev/null # Disable shellcheck source following
. ./.env set
set +o allexport

echo ">>> Running [$service] in development mode..."
cd $target
PORT=$port ts-node-dev --transpile-only --respawn ./src/index.ts
cd ../..
`;

export function generateScripts(dir: string): void {
  createDirectory(dir);
  createFile(path.join(dir, "dev.sh"), devScript);
}

export function generateVsCodeTasks(dir: string, ids: string[]): void {
  createDirectory(dir);
  const group = "all-eventually-apps";
  const tasks = {
    version: "2.0.0",
    tasks: [{ label: group, dependsOn: ids }].concat(
      ids.map(
        (id, index) =>
          ({
            label: id,
            type: "shell",
            command: `npm run dev ${id} ${3000 + index}`,
            presentation: {
              reveal: "always",
              panel: "new",
              group,
            },
          } as any)
      )
    ),
  };
  createFile(path.join(dir, "tasks.json"), JSON.stringify(tasks, null, 2));
}

export function generateDockerCompose(dir: string, ids: string[]): void {
  ids.forEach((id) =>
    createFile(
      path.join(dir, "packages", id, "Dockerfile"),
      `FROM node:18-alpine
WORKDIR /app
COPY dist ./dist
COPY package.json ./
RUN npm install
EXPOSE 3000
CMD [ "npm", "start" ]
`
    )
  );
  createFile(
    path.join(dir, "docker-compose.yml"),
    `version: '3'
services:
${ids
  .map(
    (id, index) => `  ${id}:
    build:
      context: ./packages/${id}
      dockerfile: Dockerfile
    ports:
      - ${3000 + index}:3000
    environment:
      - LOG_LEVEL=trace
      - OAS_UI=Rapidoc
    command: npm start
`
  )
  .join("\n")}
`
  );
}
