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
            : { ...target, name: target.name + "*" },
        target: source,
        color: COLORS.event,
        arrow: false,
      }
    : source.ctx === target.ctx && !source.useRefs
    ? {
        source,
        target,
        color: COLORS.command,
        arrow: false,
      }
    : undefined; // commands with policy refs

const edgers: { [key in Visual]: Edger } = {
  context: (source, target, root) => {
    if (target.visual === "event")
      return {
        source: root.nodes.get(target.ctx.name)!,
        target: root.nodes.get(source.ctx.name)!,
        color: COLORS.event,
        arrow: true,
      };

    if (target.visual === "command")
      return {
        source: root.nodes.get(source.ctx.name)!,
        target: root.nodes.get(target.ctx.name)!,
        color: COLORS.command,
        arrow: true,
      };

    if (target.visual === "projector")
      return {
        source: root.nodes.get(source.ctx.name)!,
        target: root.nodes.get(target.ctx.name)!,
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
      source.ctx === target.ctx
        ? target
        : { ...target, name: target.name + "*" },
    target: source,
    color: COLORS.event,
    arrow: false,
  }),
  command: () => undefined,
  event: () => undefined,
  actor: () => undefined,
};

const addRef = (source: Node, target: Node) => {
  !source.refs && (source.refs = new Set());
  source.refs.add(target);
};

const addRel = (stm: Node, msg: Node) => {
  msg.rels = msg.rels ?? new Set<number>();
  msg.rels.add(stm.index);
};

const addSchema = (
  ctx: ContextNode,
  name: string,
  { requires, optional, description }: schema.Schema
) => {
  const schema = ctx.schemas.get(name) ?? new Schema(name, description);
  ctx.schemas.set(name, schema);

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

const addBaseSchema = (ctx: ContextNode, name: string, base: string) => {
  const schema = ctx.schemas.get(name);
  const baseSchema = ctx.schemas.get(base);
  if (schema && baseSchema) {
    baseSchema.forEach(
      (value, key) => !schema.has(key) && schema.set(key, value)
    );
  }
};

export const compile = (model: schema.Grammar): ContextNode => {
  let count = 0;

  const newContext = (
    parent?: ContextNode,
    name = "",
    hidden = false
  ): ContextNode => ({
    index: ++count,
    name,
    visual: "context",
    ctx: parent ?? ({} as ContextNode),
    color: hidden ? undefined : COLORS.context,
    nodes: new Map(),
    edges: new Map(),
    schemas: new Map(),
    x: 0,
    y: 0,
  });

  const root = newContext();

  const getNode = (ctx: ContextNode, name: string, visual: Visual): Node => {
    // resolve [Context.]Target
    const [a, b] = name.split(".");
    if (b) {
      ctx = root.nodes.get(a) as ContextNode;
      if (!ctx) {
        ctx = newContext(root, a);
        root.nodes.set(a, ctx);
      }
      name = b;
    }
    !ctx.nodes.has(name) &&
      ctx.nodes.set(name, {
        index: ++count,
        name,
        visual,
        color: COLORS[visual],
        ctx,
      });
    const node = ctx.nodes.get(name)!;
    return node;
  };

  const addStmt = (
    ctx: ContextNode,
    name: string,
    statement: schema.Statement
  ): void => {
    if (statement.type === "schema") {
      addSchema(ctx, name, statement);
    } else {
      const node = getNode(ctx, name, statement.type);
      node.description = statement.description;
      if ("useRefs" in statement) node.useRefs = statement.useRefs;
      if ("schema" in statement) addSchema(ctx, name, statement.schema!);
      if (statement.type === "command") {
        statement.actors &&
          Object.keys(statement.actors).forEach((actor) =>
            getNode(ctx, actor, "actor")
          );
      } else if (statement.type !== "event") {
        Object.entries(statement).forEach(([action, list]) => {
          if (Array.isArray(list)) {
            const visual = rules[statement.type]![action as Action];
            visual &&
              list.forEach((rel) => {
                const msg = getNode(ctx, rel, visual);
                addRel(node, msg);
              });
          }
        });
      }
    }
  };

  Object.entries(model).forEach(([name, context]) => {
    const ctx = newContext(root, name);
    root.nodes.set(name, ctx);
    Object.entries(context).forEach(([name, statement]) =>
      addStmt(ctx, name, statement)
    );
  });

  // connect the model!
  Object.entries(model).forEach(([name, context]) => {
    const ctx = root.nodes.get(name) as ContextNode;
    Object.entries(context).forEach(([name, statement]) => {
      if (statement.type === "schema") {
        statement.base && addBaseSchema(ctx, name, statement.base);
      } else {
        const edger = edgers[statement.type];
        const source = ctx.nodes.get(name)!;

        // connect base and value objects in schema
        if ("schema" in statement && statement.schema?.base)
          addBaseSchema(ctx, name, statement.schema.base);

        // connect actors and read models
        if (statement.type === "command" && statement.actors) {
          Object.entries(statement.actors).forEach(([name, projectors]) => {
            const actor = { ...ctx.nodes.get(name)! }; // clone it!
            addRef(source, actor);
            projectors.forEach((name) => {
              const projector = getNode(ctx, name, "projector");
              projector && addRef(actor, projector);
            });
          });
        }

        Object.entries(statement).forEach(([action, list]) => {
          Array.isArray(list) &&
            list.forEach((name: string) => {
              const target = getNode(
                ctx,
                name,
                rules[statement.type]![action as Action]!
              );

              // connect policies invoking commands
              if (
                (source.visual === "policy" || source.visual === "process") &&
                target.visual === "command" &&
                (source.ctx !== target.ctx || source.useRefs)
              ) {
                addRef(target, source);
                addRel(source, target);
              }

              // connect contexts
              if (ctx.color && source.ctx !== target.ctx) {
                const edge = edgers.context(source, target, root) as Edge;
                if (edge) {
                  const key = `${edge.source.name}->${edge.target.name}-${
                    edge.color || ""
                  }`;
                  !root.edges.has(key) && root.edges.set(key, edge);
                }
              }

              // connect edges inside context
              const edge = edger(source, target, root);
              if (edge) {
                ctx.edges.set(`${edge.source.name}->${edge.target.name}`, edge);
                ctx.nodes.set(edge.source.name, edge.source);
                ctx.nodes.set(edge.target.name, edge.target);
              }
            });
        });
      }
    });
  });

  return root;
};
