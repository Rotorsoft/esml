import path from "node:path";
import { ContextNode, Visual } from "../artifacts";
import { compile } from "../compiler";
import { parse } from "../parser";
import { createJestConfig, createPackageJson, createTsConfig } from "./configs";
import { createSchemas, toName, toDefault, toDefaultEvent } from "./schemas";
import {
  generateDockerCompose,
  generateScripts,
  generateVsCodeTasks,
} from "./scripts";
import { Art } from "./types";
import { createDirectory, createFile, decamelize, loadFile } from "./utils";

function createIndexFile(filePath: string, arts: Art[]): void {
  const indexContent = `import { app, bootstrap } from "@rotorsoft/eventually";
import { ExpressApp } from "@rotorsoft/eventually-express";
${arts
  .map(({ name, type }) => `import { ${name} } from "./${name}.${type}";`)
  .join("\n")}
  
bootstrap(async () => {
  app(new ExpressApp())\n${arts
    .map(({ name }) => `    .with(${name})`)
    .join("\n")};
  app().build();
  await app().listen();
});`;
  createFile(filePath, indexContent);
}

function createAggregate(projectDirectory: string, art: Art): void {
  const content = `import { InferAggregate } from "@rotorsoft/eventually";
import { ${art.name}Schemas } from "./schemas/${art.name}.schemas";
  
export const ${art.name} = (stream: string): InferAggregate<typeof ${
    art.name
  }Schemas> => ({
  description: "TODO: describe this artifact!",
  stream,
  schemas: ${art.name}Schemas,
  init: () => (${toDefault(art.schema)}),
  reduce: {
${art.out
  .map(
    (event) =>
      `    ${toName(event)}: (state, { data }) => ({ ...state, ...data })`
  )
  .join(",\n")} 
  },
  given: {
${art.in.map((command) => `    ${command.id}: []`).join(",\n")} 
  },
  on: {
${art.in
  .map(
    (command) =>
      `    ${command.id}: (data, state, actor) => { return Promise.resolve([]); }`
  )
  .join(",\n")} 
  },
});  
`;

  const unitTest = `import { app, client, dispose } from "@rotorsoft/eventually";
import { ${art.name} } from "../${art.name}.${art.type}";
import { randomUUID } from "node:crypto";

describe("${art.name} ${art.type}", () => {
  beforeAll(() => {
    app().with(${art.name}).build();
  });

  afterAll(async () => {
    await dispose()();
  });

  it("should handle commands", async() => {
    const target = { stream: randomUUID(), actor: { id: randomUUID(), name: "actor", roles: [] } };
${art.in
  .map(
    (command) =>
      `    await client().command(${art.name}, "${command.id}", ${toDefault(
        command.schema
      )}, target);`
  )
  .join("\n")}
    const snap = await client().load(${art.name}, target.stream);
    expect(snap.state).toBeDefined;
  })
})  
`;

  createFile(
    path.join(projectDirectory, `src/${art.name}.${art.type}.ts`),
    content
  );
  createFile(
    path.join(projectDirectory, `src/__tests__/${art.name}.spec.ts`),
    unitTest
  );
}

function createSystem(projectDirectory: string, art: Art): void {
  const content = `import { InferSystem } from "@rotorsoft/eventually";
import { ${art.name}Schemas } from "./schemas/${art.name}.schemas";
  
export const ${art.name} = (): InferSystem<typeof ${art.name}Schemas> => ({
  description: "TODO: describe this artifact!",
  stream: "${art.name}",
  schemas: ${art.name}Schemas,
  on: {
${art.in
  .map(
    (command) =>
      `    ${command.id}: (data, state, actor) => { return Promise.resolve([]); }`
  )
  .join(",\n")} 
  },
});  
`;

  const unitTest = `import { app, client, dispose } from "@rotorsoft/eventually";
import { ${art.name} } from "../${art.name}.${art.type}";
import { randomUUID } from "node:crypto";

describe("${art.name} ${art.type}", () => {
  beforeAll(() => {
    app().with(${art.name}).build();
  });

  afterAll(async () => {
    await dispose()();
  });

  it("should handle commands", async() => {
    const target = { stream: randomUUID(), actor: { id: randomUUID(), name: "actor", roles: [] } };
${art.in
  .map(
    (command) =>
      `    await client().command(${art.name}, "${command.id}", ${toDefault(
        command.schema
      )}, target);`
  )
  .join("\n")}
    const result = await client().query({ stream: "${art.name}" });
    expect(result).toBeDefined();
  })
})  
`;

  createFile(
    path.join(projectDirectory, `src/${art.name}.${art.type}.ts`),
    content
  );
  createFile(
    path.join(projectDirectory, `src/__tests__/${art.name}.spec.ts`),
    unitTest
  );
}

function createPolicy(projectDirectory: string, art: Art): void {
  const content = `import { InferPolicy } from "@rotorsoft/eventually";
import { ${art.name}Schemas } from "./schemas/${art.name}.schemas";
  
export const ${art.name} = (): InferPolicy<typeof ${art.name}Schemas> => ({
  description: "TODO: describe this artifact!",
  schemas: ${art.name}Schemas,
  on: {
${art.in
  .map(
    (event) =>
      `    ${toName(event)}: () => { return Promise.resolve(undefined); }`
  )
  .join(",\n")} 
  },
});
`;

  const unitTest = `import { app, broker, client, dispose } from "@rotorsoft/eventually";
import { ${art.name} } from "../${art.name}.${art.type}";

describe("${art.name} ${art.type}", () => {
  beforeAll(() => {
    app().with(${art.name}).build();
  });

  afterAll(async () => {
    await dispose()();
  });

  it("should handle events", async() => {
${art.in
  .map(
    (event) =>
      `    await client().event(${art.name}, ${toDefaultEvent(event)});`
  )
  .join("\n")}
    await broker().drain();
    expect(1).toBeDefined; // TODO: expect side effects
  })
})  
`;

  createFile(
    path.join(projectDirectory, `src/${art.name}.${art.type}.ts`),
    content
  );
  createFile(
    path.join(projectDirectory, `src/__tests__/${art.name}.spec.ts`),
    unitTest
  );
}

function createProcess(projectDirectory: string, art: Art): void {
  const content = `import { InferProcessManager } from "@rotorsoft/eventually";
import { ${art.name}Schemas, ${art.name}OutputSchema } from "./schemas/${
    art.name
  }.schemas";
  
export const ${art.name} = (): InferProcessManager<typeof ${
    art.name
  }Schemas, typeof ${art.name}OutputSchema> => ({
  description: "TODO: describe this artifact!",
  schemas: ${art.name}Schemas,
  init: () => (${toDefault(art.schema)}),
  reduce: {
    TodoOutputEvents: (state, { data }) => ({ ...state, ...data }), // TODO: reduce all output events
  },
  actor: {
${art.in
  .map((event) => `    ${toName(event)}: ({ stream }) => stream`)
  .join(",\n")} 
  },
  on: {
${art.in
  .map(
    (event) =>
      `    ${toName(event)}: () => { return Promise.resolve(undefined); }`
  )
  .join(",\n")} 
  },
});
`;

  const unitTest = `import { app, broker, client, dispose } from "@rotorsoft/eventually";
import { ${art.name} } from "../${art.name}.${art.type}";

describe("${art.name} ${art.type}", () => {
  beforeAll(() => {
    app().with(${art.name}).build();
  });

  afterAll(async () => {
    await dispose()();
  });

  it("should handle events", async() => {
${art.in
  .map(
    (event) =>
      `    await client().event(${art.name}, ${toDefaultEvent(event)});`
  )
  .join("\n")}
    await broker().drain();
    expect(1).toBeDefined; // TODO: expect side effects
  })
})  
`;

  createFile(
    path.join(projectDirectory, `src/${art.name}.${art.type}.ts`),
    content
  );
  createFile(
    path.join(projectDirectory, `src/__tests__/${art.name}.spec.ts`),
    unitTest
  );
}

function createProjector(projectDirectory: string, art: Art): void {
  const content = `import { InferProjector } from "@rotorsoft/eventually";
import { ${art.name}Schemas } from "./schemas/${art.name}.schemas";
  
export const ${art.name} = (): InferProjector<typeof ${art.name}Schemas> => ({
  description: "TODO: describe this artifact!",
  schemas: ${art.name}Schemas,
  on: {
${art.in
  .map(
    (event) =>
      `    ${toName(
        event
      )}: ({ stream, data }) => { return Promise.resolve({ upserts: [], deletes: [] }); }`
  )
  .join(",\n")} 
  },
});
`;

  const unitTest = `import { app, broker, client, dispose } from "@rotorsoft/eventually";
import { ${art.name} } from "../${art.name}.${art.type}";

describe("${art.name} ${art.type}", () => {
  beforeAll(() => {
    app().with(${art.name}).build();
  });

  afterAll(async () => {
    await dispose()();
  });

  it("should handle events", async() => {
${art.in
  .map(
    (event) =>
      `    await client().project(${art.name}, ${toDefaultEvent(event)});`
  )
  .join("\n")}
    await broker().drain();
    const records = await client().read(${art.name}, "projectionId", ()=>{});
  })
})  
`;

  createFile(
    path.join(projectDirectory, `src/${art.name}.${art.type}.ts`),
    content
  );
  createFile(
    path.join(projectDirectory, `src/__tests__/${art.name}.spec.ts`),
    unitTest
  );
}

const artMap: { [key in Visual]?: (filePath: string, art: Art) => void } = {
  aggregate: createAggregate,
  system: createSystem,
  policy: createPolicy,
  process: createProcess,
  projector: createProjector,
};

const Arts: Array<Visual> = [
  "aggregate",
  "system",
  "policy",
  "process",
  "projector",
];

function generateContext(
  dir: string,
  name: string,
  ctx?: ContextNode,
  workspace = false
): void {
  createDirectory(dir);
  createPackageJson(dir, name);
  createJestConfig(dir);
  workspace && createTsConfig(dir, "../../tsconfig.json");
  createDirectory(path.join(dir, "src"));
  createDirectory(path.join(dir, "src", "schemas"));
  createDirectory(path.join(dir, "src", "__tests__"));
  createDirectory(path.join(dir, "dist"));
  const arts: Art[] = ctx
    ? [...ctx.nodes.entries()]
        .filter(([, value]) => Arts.includes(value.visual))
        .map(([name, value]) => ({
          name,
          type: value.visual,
          schema: value.schema,
          in: [...ctx.edges.values()]
            .filter(({ target }) => target.id === name)
            .map(({ source }) => source),
          out: [...ctx.edges.values()]
            .filter(({ source }) => source.id === name)
            .map(({ target }) => target),
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];
  arts.forEach((art) => {
    artMap[art.type]!(dir, art);
    createSchemas(dir, art);
  });
  createIndexFile(path.join(dir, "src/index.ts"), arts);
}

export function generateContexts(
  projectDirectory: string,
  project: string
): void {
  const esml = loadFile(path.join(process.cwd(), `${project}.esml`));
  if (esml) {
    const statements = parse(esml);
    const root = compile(statements);
    root.nodes.delete("actors");
    if (root.nodes.size === 1)
      generateContext(
        projectDirectory,
        project,
        root.nodes.values().next().value
      );
    else {
      const ids = [...root.nodes.keys()].map((id) => decamelize(id)).sort();
      createPackageJson(
        projectDirectory,
        project,
        ids.map((id) => `packages/${id}`)
      );
      createDirectory(path.join(projectDirectory, "packages"));
      root.nodes.forEach((node, name) => {
        const pkg = decamelize(name);
        generateContext(
          path.join(projectDirectory, "packages", pkg),
          pkg,
          node as ContextNode,
          true
        );
      });
      generateVsCodeTasks(path.join(projectDirectory, ".vscode"), ids);
      generateScripts(path.join(projectDirectory, "scripts"));
      generateDockerCompose(projectDirectory, ids);
    }
  } else {
    generateContext(projectDirectory, project);
  }
}
