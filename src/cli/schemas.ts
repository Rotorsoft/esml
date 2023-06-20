import path from "node:path";
import { FieldType, Node, ScalarFieldTypes, Schema } from "../artifacts/types";
import { createFile } from "./utils";
import { Art } from "./types";
import { randomUUID } from "node:crypto";

export const toName = (node: Node) => node.id.replace("*", "");

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
  }`;
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
      ? [...schema.values()]
          .map((f) => `${f.name}: ${toDefaultValue(f.type)}`)
          .join(", ")
      : ""
  }}`;
}

export function toDefaultEvent(event: Node): string {
  return `{ name: "${toName(
    event
  )}", id: 0, stream: "", version: 0, created: new Date(), metadata: { correlation: "", causation: {} }, data: ${toDefault(
    event.schema
  )} }`;
}

function toSchema(art: Art): string | undefined {
  const state = art.schema && toZod(art.schema, 2);
  const inputs =
    art.in &&
    art.in.map((v) => `    ${toName(v)}: ${toZod(v.schema)}`).join(",\n");
  const outputs =
    art.out &&
    art.out.map((v) => `    ${toName(v)}: ${toZod(v.schema)}`).join(",\n");

  switch (art.type) {
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
  state: ${state || "z.object({})"},
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
  state: ${state || "z.object({})"},
  commands: {
${outputs} 
  },
  events: {
${inputs} 
  },`;

    case "projector":
      return `
  state: ${state || "z.object({ id: z.string() })"},
  events: {
${inputs} 
  },`;
  }
}

export function createSchemas(projectDirectory: string, art: Art): void {
  const refschemas: string[] = [];
  [
    art.schema,
    ...art.in?.map((v) => v.schema),
    ...art.out?.map((v) => v.schema),
  ]
    .filter(Boolean)
    .forEach((sch) => {
      sch!.forEach((field) => {
        if (!ScalarFieldTypes.includes(field.type as any)) {
          const refschema = field.type as Schema;
          refschemas.push(refschema.toString());
          const schema = `import { z } from "zod";
            
export const ${refschema.toString()} = ${toZod(refschema, 1)}
        `;
          createFile(
            path.join(
              projectDirectory,
              `src/schemas/${refschema.toString()}.schema.ts`
            ),
            schema
          );
        }
      });
    });

  const outputSchema =
    art.type === "process" &&
    `export const ${art.name}OutputSchema = {
  TodoOutputEvents: z.object({}),
};`;

  const schemas = `import { z } from "zod";
${refschemas.map((r) => `import { ${r} } from "./${r}.schema";`).join("\n")}  
    
export const ${art.name}Schemas = {${toSchema(art)}
};

${outputSchema || ""}
`;
  createFile(
    path.join(projectDirectory, `src/schemas/${art.name}.schemas.ts`),
    schemas
  );
}
