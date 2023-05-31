import path from "node:path";
import { createFile, loadFile } from "./utils";
import { Art } from "./types";
import { ArtType } from "../artifacts";
import { parse } from "../parser";

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
  const inputs = art.rels.filter((r) => r.type === "command");
  const outputs = art.rels.filter((r) => r.type === "event");

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
${outputs
  .map((e) => `    ${e.name}: (state, { data }) => ({ ...state, ...data })`)
  .join(",\n")} 
  },
  given: {
${inputs.map((e) => `    ${e.name}: []`).join(",\n")} 
  },
  on: {
${inputs
  .map(
    (e) =>
      `    ${e.name}: (data, state, actor) => { return Promise.resolve([]); }`
  )
  .join(",\n")} 
  },
});  
`;

  const schemas = `import { z } from "zod";
    
export const ${art.name}Schemas = {
  state: z.object({}),
  commands: {
${inputs.map((e) => `    ${e.name}: z.object({})`).join(",\n")} 
  },
  events: {
${outputs.map((e) => `    ${e.name}: z.object({})`).join(",\n")} 
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
${inputs
  .map(
    (c) => `    await client().command(${art.name}, "${c.name}", {}, target);`
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
  const inputs = art.rels.filter((r) => r.type === "event");
  const outputs = art.rels.filter((r) => r.type === "command");

  const content = `import { InferPolicy } from "@rotorsoft/eventually";
import { ${art.name}Schemas } from "./schemas/${art.name}.schemas";
  
export const ${art.name} = (): InferPolicy<typeof ${art.name}Schemas> => ({
  description: "TODO: describe this artifact!",
  schemas: ${art.name}Schemas,
  on: {
${inputs
  .map((e) => `    ${e.name}: () => { return Promise.resolve(undefined); }`)
  .join(",\n")} 
  },
});
`;

  const schemas = `import { z } from "zod";
    
export const ${art.name}Schemas = {
  commands: {
${outputs.map((e) => `    ${e.name}: z.object({})`).join(",\n")} 
  },
  events: {
${inputs.map((e) => `    ${e.name}: z.object({})`).join(",\n")} 
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
${inputs
  .map(
    (e) =>
      `    await client().event(${art.name}, { name: "${e.name}", data: {}, id: 0, stream: "", version: 0, created: new Date(), metadata: { correlation: "", causation: {} } });`
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
  const inputs = art.rels.filter((r) => r.type === "event");

  const content = `import { InferProjector } from "@rotorsoft/eventually";
import { ${art.name}Schemas } from "./schemas/${art.name}.schemas";
  
export const ${art.name} = (): InferProjector<typeof ${art.name}Schemas> => ({
  description: "TODO: describe this artifact!",
  schemas: ${art.name}Schemas,
  on: {
${inputs
  .map(
    (e) =>
      `    ${e.name}: ({ stream, data }) => { return Promise.resolve({ upserts: [], deletes: [] }); }`
  )
  .join(",\n")} 
  },
});
`;

  const schemas = `import { z } from "zod";
    
export const ${art.name}Schemas = {
  state: z.object({ id: z.string() }),
  events: {
${inputs.map((e) => `    ${e.name}: z.object({})`).join(",\n")} 
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
${inputs
  .map(
    (e) =>
      `    await client().project(${art.name}, { name: "${e.name}", data: {}, id: 0, stream: "", version: 0, created: new Date(), metadata: { correlation: "", causation: {} } });`
  )
  .join("\n")}
    await broker().drain();
    const records = await client().read(Tickets, "projectionId", ()=>{});
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

const artMap: { [key in ArtType]?: (filePath: string, art: Art) => void } = {
  aggregate: createSystem,
  system: createSystem,
  policy: createPolicy,
  process: createPolicy,
  projector: createProjector,
};

const withStatements: Array<ArtType> = [
  "aggregate",
  "system",
  "policy",
  "process",
  "projector",
];

export function generateContent(
  projectDirectory: string,
  project: string
): void {
  const esml = loadFile(path.join(process.cwd(), `${project}.esml`));
  if (esml) {
    const statements = parse(esml);
    const arts: Art[] = statements
      ? [...statements.entries()]
          .filter(([, value]) => withStatements.includes(value.type))
          .map(([name, value]) => ({
            name,
            type: value.type,
            rels: [...value.rels.entries()].map(([name, rule]) => ({
              name,
              type: rule.visual,
            })),
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
      : [];
    arts.forEach((art) => artMap[art.type]!(projectDirectory, art));
    createIndexFile(path.join(projectDirectory, "src/index.ts"), arts);
  } else createIndexFile(path.join(projectDirectory, "src/index.ts"), []);
}
