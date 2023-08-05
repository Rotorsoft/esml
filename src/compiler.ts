import {
  COLORS,
  Field,
  ScalarFieldTypes,
  Schema,
  type Action,
  type ContextNode,
  type Edge,
  type Node,
  type Visual,
  Edger,
} from "./types";
import * as schema from "./schema";

const rules: Partial<Record<Visual, Partial<Record<Action, Visual>>>> = {
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
  },
  process: {
    handles: "event",
    invokes: "command",
  },
  projector: { handles: "event" },
};

const system: Edger = (source, target) =>
  target.visual === "command"
    ? { source: target, target: source }
    : { source, target };

const policy: Edger = (source, target) =>
  target.visual === "event"
    ? {
        source:
          source.ctx === target.ctx
            ? target
            : { ...target, id: target.id + "*" },
        target: source,
        color: COLORS.event,
        arrow: false,
      }
    : // : source.ctx === target.ctx
      // ? {
      //     source,
      //     target,
      //     color: COLORS.command,
      //     arrow: false,
      //   }
      undefined; // policy -> (external?) command

const edgers: { [key in Visual]: Edger } = {
  context: (source, target, root) => {
    if (target.visual === "event")
      return {
        source: root.nodes.get(target.ctx.id)!,
        target: root.nodes.get(source.ctx.id)!,
        color: COLORS.event,
        arrow: true,
      };

    if (target.visual === "command")
      return {
        source: root.nodes.get(source.ctx.id)!,
        target: root.nodes.get(target.ctx.id)!,
        color: COLORS.command,
        arrow: true,
      };

    if (target.visual === "projector")
      return {
        source: root.nodes.get(source.ctx.id)!,
        target: root.nodes.get(target.ctx.id)!,
        color: COLORS.projector,
        arrow: true,
      };
  },
  aggregate: system,
  system: system,
  policy: policy,
  process: policy,
  projector: (source, target) => ({
    source:
      source.ctx === target.ctx ? target : { ...target, id: target.id + "*" },
    target: source,
    color: COLORS.event,
    arrow: false,
  }),
  command: () => undefined,
  event: () => undefined,
  actor: () => undefined,
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
  schemas: new Map(),
  x: 0,
  y: 0,
});

const addRef = (source: Node, target: Node) => {
  !source.refs && (source.refs = new Set());
  source.refs.add(target);
};

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
    if (statement.type === "schema") {
      addSchema(ctx, id, statement);
    } else {
      const node = getNode(ctx, id, statement.type);
      node.description = statement.description;
      if ("schema" in statement) addSchema(ctx, id, statement.schema!);
      if (statement.type === "command") {
        statement.actors &&
          Object.keys(statement.actors).forEach((actor) =>
            getNode(ctx, actor, "actor")
          );
      } else if (statement.type !== "event") {
        Object.entries(statement).forEach(([action, list]) => {
          if (Array.isArray(list)) {
            const visual = rules[statement.type]![action as Action];
            visual && list.forEach((rel) => getNode(ctx, rel, visual));
          }
        });
      }
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
      if (statement.type === "schema") {
        statement.base && addBaseSchema(ctx, id, statement.base);
      } else {
        const edger = edgers[statement.type];
        const source = ctx.nodes.get(id)!;

        // connect base and value objects in schema
        if ("schema" in statement && statement.schema?.base)
          addBaseSchema(ctx, id, statement.schema.base);

        // connect actors and read models
        if (statement.type === "command" && statement.actors) {
          Object.entries(statement.actors).forEach(([id, projectors]) => {
            const actor = { ...ctx.nodes.get(id)! }; // clone it!
            addRef(source, actor);
            projectors.forEach((id) => {
              const projector = getNode(ctx, id, "projector");
              projector && addRef(actor, projector);
            });
          });
        }

        Object.entries(statement).forEach(([action, list]) => {
          Array.isArray(list) &&
            list.forEach((id: string) => {
              const target = getNode(
                ctx,
                id,
                rules[statement.type]![action as Action]!
              );

              // connect policies invoking commands
              (source.visual === "policy" || source.visual === "process") &&
                target.visual === "command" &&
                addRef(target, source);

              // connect contexts
              if (ctx.color && source.ctx !== target.ctx) {
                const edge = edgers.context(source, target, root) as Edge;
                if (edge) {
                  const key = `${edge.source.id}->${edge.target.id}-${
                    edge.color || ""
                  }`;
                  !root.edges.has(key) && root.edges.set(key, edge);
                }
              }

              // connect edges inside context
              const edge = edger(source, target, root);
              if (edge) {
                ctx.edges.set(`${edge.source.id}->${edge.target.id}`, edge);
                ctx.nodes.set(edge.source.id, edge.source);
                ctx.nodes.set(edge.target.id, edge.target);
              }
            });
        });
      }
    });
  });

  return root;
};
