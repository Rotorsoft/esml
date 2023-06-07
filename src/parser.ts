import {
  Action,
  ArtType,
  ArtTypes,
  Keywords,
  Source,
  Statement,
  artifacts,
} from "./artifacts";

type Token = {
  readonly token: string;
  readonly source: Source;
};

export class ParseError extends Error {
  constructor(
    readonly source: Source,
    readonly expected: string,
    readonly actual: string
  ) {
    super(
      `Parser error at line ${source.from.line}: Expected ${expected} but got ${actual}`
    );
  }
}

type Pos = {
  ix: number;
  line: number;
  line_ix: number;
};

export const parse = (code: string): Map<string, Statement> => {
  const statements: Map<string, Statement> = new Map();
  const pos: Pos = { ix: 0, line: 0, line_ix: 0 };
  const token_from: Pos = { ix: 0, line: 0, line_ix: 0 };
  const token_to: Pos = { ix: 0, line: 0, line_ix: 0 };

  const source = (): Source => ({
    from: {
      line: token_from.line,
      col: token_from.ix - token_from.line_ix,
    },
    to: { line: token_to.line, col: token_to.ix - token_to.line_ix },
  });

  const error = (expected: string, actual: string): never => {
    throw new ParseError(
      source(),
      expected,
      actual.length > 30 ? actual.substring(0, 40) + "..." : actual
    );
  };

  const notKeyword = (token: string, expected: string): void => {
    if ([...Keywords].includes(token as any)) error(expected, token);
  };

  const BLANKS = ["\t", " ", "\n", "\r"];
  const skipBlanksAndComments = (): void => {
    Object.assign(token_to, pos);
    while (pos.ix < code.length) {
      let char = code.charAt(pos.ix);
      if (char === "\n") {
        pos.line++;
        pos.line_ix = ++pos.ix;
      } else if (BLANKS.includes(char)) {
        pos.ix++;
      } else if (char === "#") {
        do {
          pos.ix++;
          char = code.charAt(pos.ix);
        } while (pos.ix < code.length && char !== "\n");
      } else break;
    }
  };

  const nextToken = (): Token => {
    skipBlanksAndComments();
    let partial = "";
    let token = "";
    let char = "";
    Object.assign(token_from, pos);
    Object.assign(token_to, pos);
    while (pos.ix < code.length) {
      char = code.charAt(pos.ix);
      if (
        (char >= "a" && char <= "z") ||
        (char >= "A" && char <= "Z") ||
        (partial.length && char >= "0" && char <= "9")
      ) {
        partial += char;
        token += char;
        pos.ix++;
      } else if (![",", ...BLANKS].includes(char)) {
        error("identifier", char);
      } else {
        skipBlanksAndComments();
        if (pos.ix < code.length) {
          char = code.charAt(pos.ix);
          if (char !== ",") break;
          partial = "";
          token += char;
          pos.ix++;
          skipBlanksAndComments();
        }
      }
    }
    return { token, source: source() };
  };

  const parseStatement = (type: Token): Token => {
    const { token: name, source } = nextToken();
    !name && error("name", "nothing");
    name.indexOf(",") > 0 && error("name", "names");
    notKeyword(name, "name");

    !statements.has(name) &&
      statements.set(name, {
        type: type.token as ArtType,
        source: type.source,
        rels: new Map(),
      });
    const statement = statements.get(name)!;
    type.token !== "schema" &&
      statement.type !== type.token &&
      error(statement.type, type.token);
    statement.source.to = source.to;

    let next = nextToken();
    if (ArtTypes.includes(next.token as ArtType)) return next; // declaration only
    const grammar = artifacts[type.token as ArtType].grammar;
    while (next.token in grammar) {
      const action = next.token as Action;
      const rel = grammar[action];
      const { token: names, source } = nextToken();
      !names && error("names", "nothing");
      names.split(",").forEach((n) => notKeyword(n.trim(), "names"));
      names
        .split(",")
        .filter(Boolean)
        .forEach((n) => statement?.rels.set(n, { ...rel!, action }));
      statement.source.to = source.to;
      next = nextToken();
    }
    return next;
  };

  let next = nextToken();
  while (next.token.length) {
    if (ArtTypes.includes(next.token as ArtType)) next = parseStatement(next);
    else if (next.token.length) error("keyword", next.token);
  }

  //console.log(statements);
  return statements;
};
