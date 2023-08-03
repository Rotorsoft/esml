import {
  COLORS,
  Field,
  ScalarFieldTypes,
  Schema,
  artifacts,
  type Action,
  type ArtType,
  type ContextNode,
  type Edge,
  type Node,
  type Visual,
} from "./artifacts";
import * as schema from "./schema";

const rules: Partial<Record<ArtType, Partial<Record<Action, Visual>>>> = {
  actor: {
    invokes: "command",
    reads: "projector",
  },
  system: {
    handles: "command",
    emits: "event",
  },
  aggregate: {
    handles: "command",
    emits: "event",
  },
  policy: {
    handles: "event",
    invokes: "command",
    reads: "projector",
  },
  process: {
    handles: "event",
    invokes: "command",
    reads: "projector",
  },
  projector: { handles: "event" },
};

const newContext = (
  parent?: ContextNode,
  id = "",
  hidden = false
): ContextNode => ({
  id,
  visual: "context",
  ctx: parent ?? ({} as ContextNode),
  color: hidden ? undefined : COLORS.context,
  nodes: new Map(),
  edges: new Map(),
  refs: new Map(),
  schemas: new Map(),
  x: 0,
  y: 0,
});

const addSchema = (
  ctx: ContextNode,
  id: string,
  { requires, optional, description }: schema.Schema
) => {
  const schema = ctx.schemas.get(id) ?? new Schema(id, description);
  ctx.schemas.set(id, schema);

  const append = (name: string, type: string, required: boolean) => {
    const scalar = ScalarFieldTypes.includes(type as any);
    if (!scalar) {
      if (!ctx.schemas.has(type)) ctx.schemas.set(type, new Schema(type));
      schema.set(name, new Field(name, required, ctx.schemas.get(type)!));
    } else schema.set(name, new Field(name, required, type as any));
  };

  requires &&
    Object.entries(requires).forEach(([name, type]) =>
      append(name, type, true)
    );

  optional &&
    Object.entries(optional).forEach(([name, type]) =>
      append(name, type, false)
    );
};

const addBaseSchema = (ctx: ContextNode, id: string, base: string) => {
  const schema = ctx.schemas.get(id);
  const baseSchema = ctx.schemas.get(base);
  if (schema && baseSchema) {
    baseSchema.forEach(
      (value, key) => !schema.has(key) && schema.set(key, value)
    );
  }
};

export const compile = (model: schema.Grammar): ContextNode => {
  const root = newContext();

  const getNode = (ctx: ContextNode, id: string, visual: Visual): Node => {
    // resolve [Context.]Target
    const [a, b] = id.split(".");
    if (b) {
      ctx = root.nodes.get(a) as ContextNode;
      if (!ctx) {
        ctx = newContext(root, a);
        root.nodes.set(a, ctx);
      }
      id = b;
    }
    !ctx.nodes.has(id) &&
      ctx.nodes.set(id, { id, visual, color: COLORS[visual], ctx });
    const node = ctx.nodes.get(id)!;
    return node;
  };

  const addStmt = (
    ctx: ContextNode,
    id: string,
    statement: schema.Statement
  ): void => {
    if (statement.type === "schema") addSchema(ctx, id, statement);
    else {
      const node = getNode(ctx, id, statement.type);
      node.description = statement.description;
      if ("schema" in statement) addSchema(ctx, id, statement.schema!);
      Object.entries(statement).forEach(([action, list]) => {
        if (Array.isArray(list)) {
          const visual = rules[statement.type]![action as Action];
          visual && list.forEach((rel) => getNode(ctx, rel, visual));
        }
      });
    }
  };

  Object.entries(model).forEach(([id, context]) => {
    const ctx = newContext(root, id);
    root.nodes.set(id, ctx);
    Object.entries(context).forEach(([id, statement]) =>
      addStmt(ctx, id, statement)
    );
  });

  // connect the model!
  Object.entries(model).forEach(([id, context]) => {
    const ctx = root.nodes.get(id) as ContextNode;
    Object.entries(context).forEach(([id, statement]) => {
      const artifact = artifacts[statement.type];
      const source = ctx.nodes.get(id)!;

      // connect base and value objects in schema
      if (statement.type === "schema" && statement.base)
        addBaseSchema(ctx, id, statement.base);
      if ("schema" in statement && statement.schema?.base)
        addBaseSchema(ctx, id, statement.schema.base);

      Object.entries(statement).forEach(([action, list]) => {
        Array.isArray(list) &&
          list.forEach((id: string) => {
            const target = getNode(
              ctx,
              id,
              rules[statement.type]![action as Action]!
            );

            // connect contexts
            if (ctx.color && source.ctx !== target.ctx) {
              const edge = artifacts.context(source, target, root) as Edge;
              if (edge) {
                const key = `${edge.source.id}->${edge.target.id}-${
                  edge.color || ""
                }`;
                !root.edges.has(key) && root.edges.set(key, edge);
              }
            }

            // connect visuals in context
            const rel = artifact(source, target, root);
            if (rel) {
              if (rel.edge) {
                ctx.edges.set(`${rel.source.id}->${rel.target.id}`, rel);
                ctx.nodes.set(rel.source.id, rel.source);
                ctx.nodes.set(rel.target.id, rel.target);
              } else {
                const src_ctx = root.nodes.get(
                  rel.source.ctx.id
                )! as ContextNode;
                !src_ctx.refs.has(rel.source.id) &&
                  src_ctx.refs.set(rel.source.id, new Set());
                src_ctx.refs.get(rel.source.id)?.add(rel.target);
              }
            }
          });
      });
    });
  });

  return root;
};
