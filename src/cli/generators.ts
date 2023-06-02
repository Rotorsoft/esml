import path from "node:path";
import { ContextNode, Visual } from "../artifacts";
import { compile } from "../compiler";
import { parse } from "../parser";
import { Art } from "./types";
import { createDirectory, createFile, loadFile } from "./utils";
import { createJestConfig, createPackageJson, createTsConfig } from "./configs";
import {
  generateDockerCompose,
  generateScripts,
  generateVsCodeTasks,
} from "./scripts";

const decamelize = (value: string): string =>
  value
    .replace(/([\p{Lowercase_Letter}\d])(\p{Uppercase_Letter})/gu, "$1-$2")
    .replace(
      /(\p{Uppercase_Letter}+)(\p{Uppercase_Letter}\p{Lowercase_Letter}+)/gu,
      "$1-$2"
    )
    .toLowerCase();

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

function createSystem(projectDirectory: string, art: Art): void {
  const content = `import { InferAggregate } from "@rotorsoft/eventually";
import { ${art.name}Schemas } from "./schemas/${art.name}.schemas";
  
export const ${art.name} = (stream: string): InferAggregate<typeof ${
    art.name
  }Schemas> => ({
  description: "TODO: describe this artifact!",
  stream,
  schemas: ${art.name}Schemas,
  init: () => ({}),
  reduce: {
${art.outputs
  .map((name) => `    ${name}: (state, { data }) => ({ ...state, ...data })`)
  .join(",\n")} 
  },
  given: {
${art.inputs.map((name) => `    ${name}: []`).join(",\n")} 
  },
  on: {
${art.inputs
  .map(
    (name) =>
      `    ${name}: (data, state, actor) => { return Promise.resolve([]); }`
  )
  .join(",\n")} 
  },
});  
`;

  const schemas = `import { z } from "zod";
    
export const ${art.name}Schemas = {
  state: z.object({}),
  commands: {
${art.inputs.map((name) => `    ${name}: z.object({})`).join(",\n")} 
  },
  events: {
${art.outputs.map((name) => `    ${name}: z.object({})`).join(",\n")} 
  },
};
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
${art.inputs
  .map(
    (name) => `    await client().command(${art.name}, "${name}", {}, target);`
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
    path.join(projectDirectory, `src/schemas/${art.name}.schemas.ts`),
    schemas
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
${art.inputs
  .map((name) => `    ${name}: () => { return Promise.resolve(undefined); }`)
  .join(",\n")} 
  },
});
`;

  const schemas = `import { z } from "zod";
    
export const ${art.name}Schemas = {
  commands: {
${art.outputs.map((name) => `    ${name}: z.object({})`).join(",\n")} 
  },
  events: {
${art.inputs.map((name) => `    ${name}: z.object({})`).join(",\n")} 
  },
};
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
${art.inputs
  .map(
    (name) =>
      `    await client().event(${art.name}, { name: "${name}", data: {}, id: 0, stream: "", version: 0, created: new Date(), metadata: { correlation: "", causation: {} } });`
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
    path.join(projectDirectory, `src/schemas/${art.name}.schemas.ts`),
    schemas
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
  init: () => ({}),
  reduce: {
    TodoOutputEvents: (state, { data }) => ({ ...state, ...data }), // TODO: reduce all output events
  },
  actor: {
${art.inputs.map((name) => `    ${name}: ({ stream }) => stream`).join(",\n")} 
  },
  on: {
${art.inputs
  .map((name) => `    ${name}: () => { return Promise.resolve(undefined); }`)
  .join(",\n")} 
  },
});
`;

  const schemas = `import { z } from "zod";
    
export const ${art.name}Schemas = {
  state: z.object({}),
  commands: {
${art.outputs.map((name) => `    ${name}: z.object({})`).join(",\n")} 
  },
  events: {
${art.inputs.map((name) => `    ${name}: z.object({})`).join(",\n")} 
  },
};

export const ${art.name}OutputSchema = {
  TodoOutputEvents: z.object({}),
};
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
${art.inputs
  .map(
    (name) =>
      `    await client().event(${art.name}, { name: "${name}", data: {}, id: 0, stream: "", version: 0, created: new Date(), metadata: { correlation: "", causation: {} } });`
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
    path.join(projectDirectory, `src/schemas/${art.name}.schemas.ts`),
    schemas
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
${art.inputs
  .map(
    (name) =>
      `    ${name}: ({ stream, data }) => { return Promise.resolve({ upserts: [], deletes: [] }); }`
  )
  .join(",\n")} 
  },
});
`;

  const schemas = `import { z } from "zod";
    
export const ${art.name}Schemas = {
  state: z.object({ id: z.string() }),
  events: {
${art.inputs.map((name) => `    ${name}: z.object({})`).join(",\n")} 
  },
};
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
${art.inputs
  .map(
    (name) =>
      `    await client().project(${art.name}, { name: "${name}", data: {}, id: 0, stream: "", version: 0, created: new Date(), metadata: { correlation: "", causation: {} } });`
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
    path.join(projectDirectory, `src/schemas/${art.name}.schemas.ts`),
    schemas
  );
  createFile(
    path.join(projectDirectory, `src/__tests__/${art.name}.spec.ts`),
    unitTest
  );
}

const artMap: { [key in Visual]?: (filePath: string, art: Art) => void } = {
  aggregate: createSystem,
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
          inputs: [...ctx.edges.values()]
            .filter(({ target }) => target.id === name)
            .map(({ source }) => source.id.replace("*", "")),
          outputs: [...ctx.edges.values()]
            .filter(({ source }) => source.id === name)
            .map(({ target }) => target.id),
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];
  arts.forEach((art) => artMap[art.type]!(dir, art));
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
