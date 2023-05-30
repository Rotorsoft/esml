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

  createFile(
    path.join(projectDirectory, `src/${art.name}.${art.type}.ts`),
    content
  );
  createFile(
    path.join(projectDirectory, `src/schemas/${art.name}.schemas.ts`),
    schemas
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

  createFile(
    path.join(projectDirectory, `src/${art.name}.${art.type}.ts`),
    content
  );
  createFile(
    path.join(projectDirectory, `src/schemas/${art.name}.schemas.ts`),
    schemas
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

  createFile(
    path.join(projectDirectory, `src/${art.name}.${art.type}.ts`),
    content
  );
  createFile(
    path.join(projectDirectory, `src/schemas/${art.name}.schemas.ts`),
    schemas
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
