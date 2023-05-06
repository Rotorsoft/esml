import {
  Artifact,
  ContextNode,
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

  type Statement = {
    type: Type;
    rels: Map<string, Visual | undefined>;
    context?: string;
  };
  const statements: Map<string, Statement> = new Map();

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

  const newContext = (id = ""): ContextNode => ({
    id,
    visual: "context",
    artifact: artifacts.context,
    nodes: new Map(),
    edges: new Set(),
    refs: new Map(),
    x: 0,
    y: 0,
  });

  const nodes = new Map<string, Node>();
  const newNode = (
    context: ContextNode,
    id: string,
    visual: Visual,
    artifact: Artifact
  ): Node => {
    const found = nodes.get(id);
    if (found) {
      if (found.visual !== visual) error(`${id} as ${found.visual}`, visual);
      return found;
    }
    const node = {
      id,
      visual,
      artifact,
      context: context.id,
    };
    nodes.set(id, node);
    return node;
  };

  const addNode = (context: ContextNode, id: string): void => {
    const statement = statements.get(id);
    if (statement && statement.type !== "context" && !statement.context) {
      statement.context = context.id;
      const artifact = artifacts[statement.type];
      const node = newNode(context, id, statement.type, artifact);
      statement.rels.forEach((visual, id) => {
        const rel = statements.get(id);
        (rel?.type || visual) === "context" && error("component", id); // nested context
        !visual && !rel && error("declared component", id); // orphans
        const ref_node = newNode(
          context,
          id,
          visual || rel!.type,
          artifacts[(visual as Type) || rel!.type]
        );
        // ignore when ref found in another context, but not events
        if (ref_node.context === context.id || ref_node.visual === "event") {
          const edge = artifact.edge(node, ref_node);
          edge && context.edges.add(edge);
          context.nodes.set(id, ref_node);
        }
      });
      context.nodes.set(id, node);
    }
  };

  let type = nextToken() as Type;
  while (type) {
    if (Types.includes(type)) {
      type = parseStatement(type);
    } else error("keyword", type);
  }

  const root = newContext();
  statements.forEach((statement, id) => {
    if (statement.type === "context") {
      const node = newContext(id);
      statement.rels.forEach((_, id) => addNode(node, id));
      root.nodes.set(id, node);
    }
  });

  // put orphans in global context
  const global = newContext("global");
  statements.forEach((statement, id) => {
    if (statement.type !== "context" && !statement.context) {
      addNode(global, id);
    }
  });
  global.nodes.size && root.nodes.set("global", global);

  // connect the model!
  const ctxedges = new Set<string>();
  statements.forEach((statement, id) => {
    if (statement.type !== "context") {
      const artifact = artifacts[statement.type];
      const node = nodes.get(id)!;
      const ctx = node.context!;

      statement.rels.forEach((visual, id) => {
        const ref_node = nodes.get(id)!;
        const ref_ctx = ref_node.context!;

        // connect contexts
        if (ctx !== ref_ctx) {
          const ctx_node = root.nodes.get(ctx)!;
          const ref_ctx_node = root.nodes.get(ref_ctx)!;
          const sys =
            statement.type === "aggregate" || statement.type === "system";
          const is_consumer =
            (visual === "event" && !sys) ||
            (visual === "command" && sys) ||
            (visual === "projector" && statement.type !== "projector");
          const producer = is_consumer ? ref_ctx_node : ctx_node;
          const consumer = is_consumer ? ctx_node : ref_ctx_node;
          const edge = artifacts.context.edge(producer, consumer);
          if (edge) {
            const key = `${producer.id}->${consumer.id}`;
            if (!ctxedges.has(key)) {
              root.edges.add(edge);
              ctxedges.add(key);
            }
          }
        }

        // connect refs
        const ref = artifact.ref(node!, ref_node!);
        if (ref) {
          const context = root.nodes.get(ref.host.context!)! as ContextNode;
          !context.refs.has(ref.host.id) &&
            context.refs.set(ref.host.id, new Map());
          context.refs
            .get(ref.host.id)!
            .set(`${ref.host.id},${ref.target.id}`, ref);
        }
      });
    }
  });

  return root;
};
