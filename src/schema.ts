import { z } from "zod";
import { ScalarFieldTypes } from "./types";

const Pascal = /^[A-Z][A-Za-z0-9]+$/;
const Camel = /^[a-z][A-Za-z0-9]+$/;
const Reference = /^([A-Z][A-Za-z0-9]+)(\.[A-Z][A-Za-z0-9]*){0,1}$/;

const List = z
  .array(
    z.string().regex(Reference, {
      message:
        "Invalid reference name. Use [Context.]Identifier in Pascal case!",
    })
  )
  .optional()
  .describe(
    "A list of references to internal or external artifacts or messages"
  );

const Fields = z
  .record(
    z.string().regex(Camel, {
      message: "Invalid field name. Use camel case!",
    }),
    z.enum(ScalarFieldTypes).or(
      z.string().regex(Pascal, {
        message: "Invalid schema name. Use Pascal case!",
      })
    )
  )
  .describe("A map of field names and types (scalar or other schemas)");

const Schema = z
  .object({
    description: z.string().optional(),
    base: z
      .string()
      .regex(Pascal, { message: "Invalid schema name. Use Pascal case!" })
      .optional(),
    requires: Fields.optional(),
    optional: Fields.optional(),
  })
  .strict()
  .describe("A message or state schema");

const Event = z
  .object({
    type: z.literal("event"),
    description: z.string().optional(),
    schema: Schema.optional(),
  })
  .strict()
  .describe("An event");

const Command = z
  .object({
    type: z.literal("command"),
    description: z.string().optional(),
    schema: Schema.optional(),
    actors: z
      .record(
        z.string().regex(Pascal, {
          message: "Invalid actor name. Use Pascal case!",
        }),
        z.array(
          z.string().regex(Reference, {
            message:
              "Invalid projector name. Use [Context.]Projector in Pascal case!",
          })
        )
      )
      .optional(),
  })
  .strict()
  .describe("A command, with actors that can read projections");

const System = z
  .object({
    type: z.literal("system"),
    description: z.string().optional(),
    handles: List,
    emits: List,
  })
  .strict()
  .describe("System artifact, can handle commands and emit events");

const Aggregate = z
  .object({
    type: z.literal("aggregate"),
    description: z.string().optional(),
    handles: List,
    emits: List,
    schema: Schema.optional(),
  })
  .strict()
  .describe(
    "Aggregate artifact, can handle commands and emit events, with a state"
  );

const Policy = z
  .object({
    type: z.literal("policy"),
    description: z.string().optional(),
    handles: List,
    invokes: List,
    useRefs: z
      .boolean()
      .optional()
      .describe("Render near commands, with no edges"),
  })
  .strict()
  .describe(
    "Policy artifact, can handle (react to) events, and invoke commands"
  );

const Process = z
  .object({
    type: z.literal("process"),
    description: z.string().optional(),
    handles: List,
    invokes: List,
    schema: Schema.optional(),
    useRefs: z
      .boolean()
      .optional()
      .describe("Render near commands, with no edges"),
  })
  .strict()
  .describe(
    "Process manager artifact, can handle (react to) events, and invoke commands, with a state"
  );

const Projector = z
  .object({
    type: z.literal("projector"),
    description: z.string().optional(),
    handles: List,
    schema: Schema.optional(),
  })
  .strict()
  .describe(
    "Projector artifact, can handle (project) events into a state (projection)"
  );

const ObjectSchema = z
  .object({
    type: z.literal("schema"),
    description: z.string().optional(),
    base: z
      .string()
      .regex(Pascal, { message: "Invalid schema name. Use Pascal case!" })
      .optional(),
    requires: Fields.optional(),
    optional: Fields.optional(),
  })
  .strict()
  .describe("Object schemas can be used as base types or value objects");

const Statement = z.union([
  Command,
  Event,
  System,
  Aggregate,
  Policy,
  Process,
  Projector,
  ObjectSchema,
]);

export const Grammar = z
  .record(
    z.string().regex(Pascal, {
      message: "Invalid context name. Use Pascal case!",
    }),
    z.record(
      z.string().regex(Pascal, {
        message: "Invalid artifact name. Use Pascal case!",
      }),
      Statement
    )
  )
  .describe("The model is a map of bounded contexts with internal artifacts");

export type Grammar = z.infer<typeof Grammar>;
export type Statement = z.infer<typeof Statement>;
export type Schema = z.infer<typeof Schema>;
