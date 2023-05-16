import {
  ArtType,
  COLORS,
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

const newContext = (id = "", hidden = false): ContextNode => ({
  id,
  visual: "context",
  ctx: "root",
  color: hidden ? undefined : COLORS.context,
  nodes: new Map(),
  edges: new Map(),
  refs: new Map(),
  x: 0,
  y: 0,
});

const ROOT_ARTS: Array<ArtType> = ["context", "actor"];

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
        error(statement, `${id} found as ${found.visual}`, visual);
      !found.ctx && owns && (found.ctx = statement.context);
      return found;
    }
    const node: Node = { id, visual, color: COLORS[visual] };
    owns && (node.ctx = statement.context);
    nodes.set(id, node);
    return node;
  };

  const addNode = (ctx: ContextNode, id: string): void => {
    const statement = statements.get(id);
    if (statement && !statement.context) {
      statement.context = ctx.id;
      const node = newNode(statement, id, statement.type, true);
      statement.rels.forEach(({ visual, owns }, id) => {
        const rel = statements.get(id);
        rel && ROOT_ARTS.includes(rel.type) && error(statement, "artifact", id); // don't rel root arts
        visual === "artifact" &&
          error(statement, "artifact type", "nested context");
        newNode(statement, id, visual as Visual, owns);
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

  // group actors and contexts in root
  const root = newContext();
  const actors = newContext("actors", true);
  root.nodes.set(actors.id, actors);
  statements.forEach((statement, id) => {
    if (statement.type === "actor") addNode(actors, id);
    else if (statement.type === "context") {
      const ctx = newContext(id);
      ctx.actors = actors;
      statement.context = ctx.ctx;
      statement.rels.forEach((_, id) => addNode(ctx, id));
      root.nodes.set(id, ctx);
    }
  });

  // orphans in global context
  const global = newContext("global");
  statements.forEach(
    (statement, id) => !statement.context && addNode(global, id)
  );
  nodes.forEach((node) => {
    if (!node.ctx) {
      node.ctx = global.id;
      global.nodes.set(node.id, node);
    }
  });
  global.nodes.size && root.nodes.set(global.id, global);

  //************/
  // debug!
  //************/
  // [...nodes.values()]
  //   .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  //   .forEach((n) => console.log(n));

  // console.log(
  //   [...statements.entries()].map(
  //     ([id, s]) =>
  //       `[${pad(s.source.from.line, 3)}:${pad(s.source.from.col, 3)} - ${pad(
  //         s.source.to.line,
  //         3
  //       )}:${pad(s.source.to.col, 3)}] ${s.type} ${id} => ${[
  //         ...s.rels.entries(),
  //       ]
  //         .map(([k, { visual }]) => `${visual} ${k}`)
  //         .join(",")}`
  //   )
  // );

  // console.log(actors);
  //************/

  // connect the model!
  statements.forEach((statement, id) => {
    if (statement.type !== "context") {
      const artifact = artifacts[statement.type];
      const source = nodes.get(id)!;
      const ctx = root.nodes.get(source.ctx!)! as ContextNode;

      statement.rels.forEach((_, id) => {
        const target = nodes.get(id)!;

        // connect contexts
        if (ctx.color && source.ctx !== target.ctx) {
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
            const src_ctx = root.nodes.get(rel.source.ctx!)! as ContextNode;
            !src_ctx.refs.has(rel.source.id) &&
              src_ctx.refs.set(rel.source.id, new Set());
            src_ctx.refs.get(rel.source.id)?.add(rel.target);
          }
        }
      });
    }
  });

  return root;
};
