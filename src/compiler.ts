import { ContextNode, Node, Visual, artifacts } from "./artifacts";
import { Source, Statement } from "./parser";

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
  edges: new Set(),
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

  const addNode = (context: ContextNode, id: string): void => {
    const statement = statements.get(id);
    if (statement && statement.type !== "context" && !statement.context) {
      statement.context = context.id;
      const node = newNode(statement, id, statement.type, true);
      statement.rels.forEach(({ visual, owns }, id) => {
        const ref = statements.get(id);
        ref?.type === "context" && error(statement, "component", id); // nested context
        if (visual === "artifact")
          error(statement, "valid relationship", visual);
        else newNode(statement, id, visual, owns);
      });
      context.nodes.set(id, node);
    }
  };

  const root = newContext();
  statements.forEach((statement, id) => {
    if (statement.type === "context") {
      const node = newContext(id);
      statement.rels.forEach((_, id) => addNode(node, id));
      root.nodes.set(id, node);
    }
  });

  // orphans in global context
  const global = newContext("global");
  statements.forEach((statement, id) => {
    if (statement.type !== "context" && !statement.context) {
      addNode(global, id);
    }
  });
  global.nodes.size && root.nodes.set("global", global);

  // debug!
  // [...nodes.values()]
  //   .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  //   .forEach((n) => console.log(n));

  // connect the model!
  const ctxmap = new Set<string>();
  statements.forEach((statement, id) => {
    if (statement.type !== "context") {
      const artifact = artifacts[statement.type];
      const node = nodes.get(id)!;
      const ctx = root.nodes.get(node.ctx!)! as ContextNode;

      statement.rels.forEach(({ visual }, id) => {
        const rel = nodes.get(id)!;

        // connect contexts
        if (rel.ctx && node.ctx !== rel.ctx) {
          const ref_ctx = root.nodes.get(rel.ctx!)!;
          const sys =
            statement.type === "aggregate" || statement.type === "system";
          const is_consumer =
            (visual === "event" && !sys) ||
            (visual === "command" && sys) ||
            (visual === "projector" && statement.type !== "projector");
          const producer = is_consumer ? ref_ctx : ctx;
          const consumer = is_consumer ? ctx : ref_ctx;
          const edge = artifacts.context.edge(producer, consumer);
          if (edge) {
            const key = `${producer.id}->${consumer.id}`;
            if (!ctxmap.has(key)) {
              root.edges.add(edge);
              ctxmap.add(key);
            }
          }
        }

        // connect edges in context
        if (node.ctx === rel.ctx || rel.visual === "event") {
          const clone = { ...rel }; // clone rel to allow contexts
          const edge = artifact.edge(node, clone);
          edge && ctx.edges.add(edge);
          ctx.nodes.set(id, clone);
        }

        // connect refs
        const ref = artifact.ref(node, rel);
        if (ref) {
          !ctx.refs.has(ref.hostId) && ctx.refs.set(ref.hostId, new Map());
          ctx.refs.get(ref.hostId)!.set(`${ref.hostId},${ref.target.id}`, ref);
        }
      });
    }
  });

  return root;
};
