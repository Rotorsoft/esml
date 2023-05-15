import {
  ContextNode,
  Edge,
  Node,
  Source,
  Statement,
  Visual,
  artifacts,
} from "./artifacts";

export class CompilerError extends Error {
  constructor(
    readonly source: Source,
    readonly expected: string,
    readonly actual: string
  ) {
    super(
      `Compiler error at line ${source.from.line}: Expected ${expected} but got ${actual}`
    );
  }
}

const error = (
  statement: Statement,
  expected: string,
  actual: string
): never => {
  throw new CompilerError(statement.source, expected, actual);
};

const newContext = (id = ""): ContextNode => ({
  id,
  visual: "context",
  nodes: new Map(),
  edges: new Map(),
  refs: new Map(),
  x: 0,
  y: 0,
});

export const compile = (statements: Map<string, Statement>): ContextNode => {
  const nodes = new Map<string, Node>();

  const newNode = (
    statement: Statement,
    id: string,
    visual: Visual,
    owns: boolean
  ): Node => {
    const found = nodes.get(id);
    if (found) {
      if (found.visual !== visual)
        error(statement, `${id} as ${found.visual}`, visual);
      !found.ctx && owns && (found.ctx = statement.context);
      return found;
    }
    const node: Node = { id, visual };
    owns && (node.ctx = statement.context);
    nodes.set(id, node);
    return node;
  };

  const addNode = (ctx: ContextNode, id: string): void => {
    const statement = statements.get(id);
    if (statement && statement.type !== "context" && !statement.context) {
      statement.context = ctx.id;
      const node = newNode(statement, id, statement.type, true);
      statement.rels.forEach(({ visual, owns }, id) => {
        const ref = statements.get(id);
        ref?.type === "context" && error(statement, "component", id); // nested context
        if (visual === "artifact")
          error(statement, "valid relationship", visual);
        else newNode(statement, id, visual, owns);
      });
      ctx.nodes.set(id, node);
    } else {
      // context including orphan statements
      const node = nodes.get(id);
      if (node && !node.ctx) {
        node.ctx = ctx.id;
        ctx.nodes.set(id, node);
      }
    }
  };

  const root = newContext();
  statements.forEach((statement, id) => {
    if (statement.type === "context") {
      const ctx = newContext(id);
      statement.rels.forEach((_, id) => addNode(ctx, id));
      root.nodes.set(id, ctx);
    }
  });

  // orphans in global context
  const global = newContext("global");
  statements.forEach((statement, id) => {
    if (statement.type !== "context" && !statement.context) {
      addNode(global, id);
    }
  });
  nodes.forEach((node) => {
    if (!node.ctx) {
      node.ctx = global.id;
      global.nodes.set(node.id, node);
    }
  });
  global.nodes.size && root.nodes.set(global.id, global);

  // debug!
  // [...nodes.values()]
  //   .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  //   .forEach((n) => console.log(n));

  // connect the model!
  statements.forEach((statement, id) => {
    if (statement.type !== "context") {
      const artifact = artifacts[statement.type];
      const source = nodes.get(id)!;
      const ctx = root.nodes.get(source.ctx!)! as ContextNode;

      statement.rels.forEach(({ visual }, id) => {
        const target = nodes.get(id)!;
        const rel_ctx = root.nodes.get(target.ctx!)! as ContextNode;

        // connect contexts
        if (source.ctx !== target.ctx) {
          const edge = artifacts.context.rel(source, target) as Edge;
          if (edge) {
            const key = `${edge.sourceId}->${edge.targetId}-${
              edge.color || ""
            }`;
            !root.edges.has(key) && root.edges.set(key, edge);
          }
        }

        // connect visuals in context
        const rel = artifact.rel(source, target);
        if (rel) {
          if ("targetId" in rel) {
            ctx.edges.set(`${rel.sourceId}->${rel.targetId}`, rel);
            if (rel.targetId === source.id)
              // clone target as source (event -> policy)
              ctx.nodes.set(rel.sourceId, { ...target, id: rel.sourceId });
            else ctx.nodes.set(rel.targetId, target);
          } else {
            // set ref in source context when target is a projector (in another ctx)
            const _ctx = visual === "projector" ? ctx : rel_ctx;
            _ctx.refs.set(`${rel.sourceId}->${rel.target.id}`, rel);
          }
        }
      });
    }
  });

  return root;
};
