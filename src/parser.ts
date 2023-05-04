import {
  EdgeType,
  Keywords,
  Node,
  Type,
  Types,
  Visual,
  artifacts,
} from "./artifacts";

type Pos = {
  index: number;
  line: number;
  line_index: number;
  token_index?: number;
};

export class ParseError extends Error {
  constructor(
    readonly expected: string,
    readonly actual: string,
    readonly line: number,
    readonly from: number,
    readonly to: number
  ) {
    super(
      `Parser error at line ${line}: Expected ${expected} but got ${actual}`
    );
  }
}

/**
 * Syntax
 *
 * - `actor` ActorName [`invokes` CommandName,...]
 * - `<aggregate|system>` SystemName [`handles` CommandName,...] [`emits` EventName,...]
 * - `<policy|process>` PolicyName [`handles` EventName,...] [`invokes` CommandName,...]
 * - `projector` ProjectorName [`handles` EventName,...]
 * - `context` ContextName [`includes` ArtifactName,...]
 */
export const parse = (source: string): Node => {
  const cursor: Pos = { index: 0, line: 1, line_index: 0 };
  const parser: Pos = { index: 0, line: 1, line_index: 0 };

  const error = (expected: string, actual: string): never => {
    const from = (parser.token_index || parser.line_index) - parser.line_index;
    const to = parser.index - parser.line_index;
    const trimmed =
      actual.length > 30 ? actual.substring(0, 30) + "..." : actual;
    throw new ParseError(expected, trimmed, parser.line, from, to);
  };

  const statements: Map<
    string,
    { type: Type; rels: Map<string, Visual | undefined>; context?: string }
  > = new Map();

  const BLANKS = ["\t", " ", "\n"];
  const skipBlanks = (): void => {
    while (cursor.index < source.length) {
      const char = source.charAt(cursor.index);
      if (char === "\n") {
        cursor.index++;
        cursor.line++;
        cursor.line_index = cursor.index;
      } else if (BLANKS.includes(char)) cursor.index++;
      else break;
    }
  };

  const nextToken = (): string => {
    skipBlanks();
    let partial = "";
    let token = "";
    let char = "";
    while (cursor.index < source.length) {
      if (parser.index != cursor.index) {
        parser.index = cursor.index;
        parser.line = cursor.line;
        parser.line_index = cursor.line_index;
        parser.token_index = cursor.index;
      }
      char = source.charAt(cursor.index);
      if (
        (char >= "a" && char <= "z") ||
        (char >= "A" && char <= "Z") ||
        (partial.length && char >= "0" && char <= "9")
      ) {
        partial += char;
        token += char;
        cursor.index++;
        if (parser.line === cursor.line) parser.index = cursor.index;
      } else if (![",", ...BLANKS].includes(char)) {
        error("identifier", char);
      } else {
        skipBlanks();
        if (cursor.index < source.length) {
          char = source.charAt(cursor.index);
          if (char !== ",") break;
          partial = "";
          token += char;
          cursor.index++;
          if (parser.line === cursor.line) parser.index = cursor.index;
          skipBlanks();
        }
      }
    }
    return token;
  };

  const notKeyword = (token: string, expected: string): void => {
    if ([...Keywords].includes(token as any)) error(expected, token);
  };

  const parseStatement = (type: Type): Type => {
    const name = nextToken();
    !name && error("name", "nothing");
    name.indexOf(",") > 0 && error("name", "names");
    notKeyword(name, "name");
    !statements.has(name) && statements.set(name, { type, rels: new Map() });

    let token = nextToken();
    if (type.includes(token as Type)) return token as Type; // declaration only

    const statement = statements.get(name);
    const grammar = artifacts[type].grammar();
    while (token in grammar) {
      const rel = grammar[token as EdgeType];
      const names = nextToken();
      !names && error("names", "nothing");
      names.split(",").forEach((n) => notKeyword(n.trim(), "names"));
      names
        .split(",")
        .filter(Boolean)
        .forEach((n) =>
          statement?.rels.set(n, rel === "artifacts" ? undefined : rel)
        );
      token = nextToken();
    }
    return token as Type;
  };

  const producer = (av: Visual, mv: Visual) => {
    const sys = av === "aggregate" || av === "system";
    return sys ? mv === "event" : mv === "command";
  };

  const _msgCtxs = new Map<
    string,
    Map<string, { context: Node; visual: Visual; producer: boolean }>
  >();
  const trackCtx = (context: Node, anode: Node, mnode: Node) => {
    let mm = _msgCtxs.get(mnode.id);
    if (!mm) {
      mm = new Map();
      _msgCtxs.set(mnode.id, mm);
    }
    const is_producer = producer(anode.visual, mnode.visual);
    let ctx = mm.get(context.id);
    if (!ctx) {
      ctx = { context, visual: mnode.visual, producer: is_producer };
      mm.set(context.id, ctx);
    } else if (!ctx.producer && is_producer) ctx.producer = is_producer;
  };

  const addNode = (context: Node, id: string): void => {
    const statement = statements.get(id);
    if (statement && statement.type !== "context" && !statement.context) {
      statement.context = context.id;
      const artifact = artifacts[statement.type];
      const anode: Node = { id, visual: statement.type, artifact };
      statement.rels.forEach((visual, id) => {
        const rel = statements.get(id);
        (rel?.type || visual) === "context" && error("component", id); // nested context
        !visual && !rel && error("declared component", id); // orphans
        const mnode: Node = { id, visual: visual || rel!.type };
        context.edges!.add(artifact.edge(anode, mnode));
        context.nodes!.set(id, mnode);
        trackCtx(context, anode, mnode);
      });
      context.nodes!.set(id, anode);
    }
  };

  let type = nextToken() as Type;
  while (type) {
    if (Types.includes(type)) {
      type = parseStatement(type);
    } else error("keyword", type);
  }

  const context = (id = ""): Node => ({
    id,
    visual: "context",
    artifact: artifacts.context,
    nodes: new Map(),
    edges: new Set(),
  });

  const root = context();
  statements.forEach((statement, id) => {
    if (statement.type === "context") {
      const node = context(id);
      statement.rels.forEach((_, id) => addNode(node, id));
      root.nodes!.set(id, node);
    }
  });

  // put orphans in global context
  const global = context("global");
  statements.forEach(
    (statement, id) =>
      statement.type !== "context" && !statement.context && addNode(global, id)
  );
  global.nodes?.size && root.nodes!.set("global", global);

  // connect contexts with shared messages
  _msgCtxs.forEach((x) => {
    if (x.size > 1) {
      const producers = [...x.values()].filter((c) => c.producer);
      const consumers = [...x.values()].filter((c) => !c.producer);
      producers.forEach((p) => {
        consumers.forEach((c) => {
          root.edges!.add(
            artifacts.context.edge(p.context!, c.context!, p.visual === "event")
          );
        });
      });
    }
  });

  return root;
};
