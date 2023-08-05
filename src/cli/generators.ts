import json5 from "json5";
import path from "node:path";
import { compile } from "../compiler";
import { Grammar } from "../schema";
import type { ContextNode, Visual } from "../types";
import { createJestConfig, createPackageJson, createTsConfig } from "./configs";
import { createSchemas, toDefault, toDefaultEvent, toName } from "./schemas";
import {
  generateDockerCompose,
  generateScripts,
  generateVsCodeTasks,
} from "./scripts";
import { Art } from "./types";
import { createDirectory, createFile, decamelize } from "./utils";

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

type ArtResult = { content: string; unitTest: string };

const artMap: { [key in Visual]?: (art: Art) => ArtResult } = {
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

function createAggregate(art: Art): ArtResult {
  const content = `import { InferAggregate } from "@rotorsoft/eventually";
import { ${art.name}Schemas } from "./schemas/${art.name}.schema";
  
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
${art.in.map((command) => `    ${command.name}: []`).join(",\n")} 
  },
  on: {
${art.in
  .map(
    (command) =>
      `    ${command.name}: (data, state, actor) => { return Promise.resolve([]); }`
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
      `    await client().command(${art.name}, "${command.name}", ${toDefault(
        command.schema
      )}, target);`
  )
  .join("\n")}
    const snap = await client().load(${art.name}, target.stream);
    expect(snap.state).toBeDefined;
  })
})  
`;

  return { content, unitTest };
}

function createSystem(art: Art): ArtResult {
  const content = `import { InferSystem } from "@rotorsoft/eventually";
import { ${art.name}Schemas } from "./schemas/${art.name}.schema";
  
export const ${art.name} = (): InferSystem<typeof ${art.name}Schemas> => ({
  description: "TODO: describe this artifact!",
  stream: "${art.name}",
  schemas: ${art.name}Schemas,
  on: {
${art.in
  .map(
    (command) =>
      `    ${command.name}: (data, state, actor) => { return Promise.resolve([]); }`
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
      `    await client().command(${art.name}, "${command.name}", ${toDefault(
        command.schema
      )}, target);`
  )
  .join("\n")}
    const result = await client().query({ stream: "${art.name}" });
    expect(result).toBeDefined();
  })
})  
`;

  return { content, unitTest };
}

function createPolicy(art: Art): ArtResult {
  const content = `import { InferPolicy } from "@rotorsoft/eventually";
import { ${art.name}Schemas } from "./schemas/${art.name}.schema";
  
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

  return { content, unitTest };
}

function createProcess(art: Art): ArtResult {
  const content = `import { InferProcessManager } from "@rotorsoft/eventually";
import { ${art.name}Schemas, ${art.name}OutputSchema } from "./schemas/${
    art.name
  }.schema";
  
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

  return { content, unitTest };
}

function createProjector(art: Art): ArtResult {
  const content = `import { client, InferProjector } from "@rotorsoft/eventually";
import { ${art.name}Schemas } from "./schemas/${art.name}.schema";
  
export const ${art.name} = (): InferProjector<typeof ${art.name}Schemas> => ({
  description: "TODO: describe this artifact!",
  schemas: ${art.name}Schemas,
  on: {
${art.in
  .map(
    (event) =>
      `    ${toName(event)}: async ({ stream, data }, map) => {
        const id = stream; // TBD

        let state = { id };
        if (!map.has(id))
          await client().read(${
            art.name
          }, id, (record) => state = record.state);
        else
          state = map.get(id)!;
        
        return [{ ...state, id }]; // TBD
      }`
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
    await client().project(${art.name}, [
${art.in.map((event) => `      ${toDefaultEvent(event)}`).join(",\n")}
    ]);
    await broker().drain();
    const records = await client().read(${art.name}, "projectionId", ()=>{});
  })
})  
`;

  return { content, unitTest };
}

export function createArtifacts(
  ctx: ContextNode,
  callback: (
    art: Art,
    result: ArtResult,
    schemas: Record<string, string>
  ) => void
): Art[] {
  const arts: Art[] = ctx
    ? [...ctx.nodes.entries()]
        .filter(([, value]) => Arts.includes(value.visual))
        .map(([name, value]) => ({
          name,
          type: value.visual,
          schema: ctx.schemas.get(value.name),
          in: [...ctx.edges.values()]
            .filter(({ target }) => target.name === name)
            .map(({ source }) => ({
              ...source,
              schema: ctx.schemas.get(source.name),
            })),
          out: [...ctx.edges.values()]
            .filter(({ source }) => source.name === name)
            .map(({ target }) => ({
              ...target,
              schema: ctx.schemas.get(target.name),
            })),
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  arts.forEach((art) => {
    const result = artMap[art.type]!(art);
    const schemas = createSchemas(art);
    callback(art, result, schemas);
  });

  return arts;
}

function generateContext(
  cdir: string,
  name: string,
  ctx: ContextNode,
  workspace = false
): void {
  createDirectory(cdir);
  createPackageJson(cdir, name);
  createJestConfig(cdir);
  workspace && createTsConfig(cdir, "../../tsconfig.json");
  createDirectory(path.join(cdir, "src"));
  createDirectory(path.join(cdir, "src", "schemas"));
  createDirectory(path.join(cdir, "src", "__tests__"));
  createDirectory(path.join(cdir, "dist"));

  const arts = createArtifacts(ctx, (art, result, schemas) => {
    createFile(
      path.join(cdir, `src/${art.name}.${art.type}.ts`),
      result.content
    );
    createFile(
      path.join(cdir, `src/__tests__/${art.name}.spec.ts`),
      result.unitTest
    );
    Object.entries(schemas).forEach(([name, content]) =>
      createFile(path.join(cdir, `src/schemas/${name}.schema.ts`), content)
    );
  });

  createIndexFile(path.join(cdir, "src/index.ts"), arts);
}

export function generateContexts(
  pdir: string,
  project: string,
  code: string
): void {
  const model = Grammar.parse(json5.parse(code));
  const root = compile(model);
  const ids = [...root.nodes.keys()].map((id) => decamelize(id)).sort();
  createPackageJson(
    pdir,
    project,
    ids.map((id) => `packages/${id}`)
  );
  createDirectory(path.join(pdir, "packages"));
  root.nodes.forEach((node, name) => {
    const pkg = decamelize(name);
    generateContext(
      path.join(pdir, "packages", pkg),
      pkg,
      node as ContextNode,
      true
    );
  });
  generateVsCodeTasks(path.join(pdir, ".vscode"), ids);
  generateScripts(path.join(pdir, "scripts"));
  generateDockerCompose(pdir, ids);
}
