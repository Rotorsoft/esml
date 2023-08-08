import { randomUUID } from "node:crypto";
import {
  ScalarFieldTypes,
  type FieldType,
  type Node,
  Schema,
  Visual,
} from "../types";
import type { Art } from "./types";

function toZodType(type: FieldType, required = true): string {
  let t: string;
  if (ScalarFieldTypes.includes(type as any)) {
    switch (type) {
      case "uuid":
        t = "z.string().uuid()";
        break;
      default:
        t = `z.${type}()`;
        break;
    }
  } else t = type.toString();
  return required ? t : t.concat(".optional()");
}

function toZod(schema?: Schema, indent = 3): string {
  return `z.object({${
    schema && schema.size > 0
      ? "\n".concat(
          [...schema.values()]
            .map(
              (f) =>
                `${" ".repeat(indent * 2)}${f.name}: ${toZodType(
                  f.type,
                  f.required
                )}`
            )
            .join(",\n"),
          "\n",
          " ".repeat((indent - 1) * 2),
          "})"
        )
      : "})"
  }${schema?.description ? `.describe("${schema.description}")` : ""}`;
}

function toDefaultValue(type: FieldType): string {
  switch (type) {
    case "boolean":
      return "true";
    case "number":
      return "0";
    case "uuid":
      return `"${randomUUID()}"`;
    case "date":
      return "new Date()";
    case "string":
      return '""';
    default:
      return toDefault(type);
  }
}

export function toDefault(schema?: Schema): string {
  return `{${
    schema
      ? [...(schema.base?.values() ?? []), ...schema.values()]
          .map((f) => `${f.name}: ${toDefaultValue(f.type)}`)
          .join(", ")
      : ""
  }}`;
}

export function toDefaultEvent(event: Node): string {
  return `{ name: "${
    event.name
  }", id: 0, stream: "", version: 0, created: new Date(), metadata: { correlation: "", causation: {} }, data: ${toDefault(
    event.ctx.schemas.get(event.name)
  )} }`;
}

function toSchema(art: Art): string | undefined {
  const inputs = art.in.map((v) => `    ${v.name}`).join(",\n");
  const outputs = art.out.map((v) => `    ${v.name}`).join(",\n");

  switch (art.visual) {
    case "system":
      return `
  commands: {
${inputs} 
  },
  events: {
${outputs} 
  },`;

    case "aggregate":
      return `
  state: ${art.name},
  commands: {
${inputs} 
  },
  events: {
${outputs} 
  },`;

    case "policy":
      return `
  commands: {
${outputs} 
  },
  events: {
${inputs} 
  },`;

    case "process":
      return `
  state: ${art.name},
  commands: {
${outputs} 
  },
  events: {
${inputs} 
  },`;

    case "projector":
      return `
  state: ${art.name},
  events: {
${inputs} 
  },`;
  }
}

const withState: Visual[] = ["aggregate", "process", "projector"];

export function createSchemas(art: Art): {
  map: string;
  schemas: Record<string, string>;
} {
  const schemas: Record<string, string> = {};

  const addSchema = (schema: Schema) => {
    const name = schema.toString();
    console.log("... schema", name);

    let content = toZod(schema, 1);
    const refs: string[] = [];

    if (schema.base) {
      refs.push(schema.base.toString());
      addSchema(schema.base);
      content = `${schema.base.toString()}.and(${content})`;
    }
    schema.forEach((field) => {
      if (!ScalarFieldTypes.includes(field.type as any)) {
        const ref = field.type as Schema;
        refs.push(ref.toString());
        addSchema(ref);
      }
    });
    const imports = refs
      .sort()
      .map((schema) => `import { ${schema} } from "./${schema}.schema";`)
      .join("\n");

    schemas[name] = `import { z } from "zod";
${imports.length ? `${imports}\n` : ""}
export const ${name} = ${content}
  `;
  };

  // collect schemas
  let state = art.ctx.schemas.get(art.name);
  if (withState.includes(art.visual) && !state) {
    state = new Schema(art.name);
    if (art.visual === "projector")
      state.set("id", { name: "id", type: "string", required: true });
  }
  const artSchemas = [
    state,
    ...art.in.map((v) => v.ctx.schemas.get(v.name) ?? new Schema(v.name)),
    ...art.out.map((v) => v.ctx.schemas.get(v.name) ?? new Schema(v.name)),
  ].filter(Boolean);
  artSchemas.forEach((schema) => addSchema(schema!));

  // fake ouput schema for processes
  const outputSchema =
    art.visual === "process" &&
    `export const ${art.name}OutputSchema = {
  TodoOutputEvents: z.object({}),
};`;

  // collect art schemas in artSchemas file, with internal refs
  const map = `import { z } from "zod";
${artSchemas
  .map((schema) => schema!.name)
  .sort()
  .map((name) => `import { ${name} } from "./${name}.schema";`)
  .join("\n")}  
    
export const ${art.name}Schemas = {${toSchema(art)}
};

${outputSchema || ""}
`;

  return { map, schemas };
}
