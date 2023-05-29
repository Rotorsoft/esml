"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.ParseError = void 0;
const artifacts_1 = require("./artifacts");
class ParseError extends Error {
    constructor(source, expected, actual) {
        super(`Parser error at line ${source.from.line}: Expected ${expected} but got ${actual}`);
        this.source = source;
        this.expected = expected;
        this.actual = actual;
    }
}
exports.ParseError = ParseError;
const parse = (code) => {
    const statements = new Map();
    const pos = { ix: 0, line: 0, line_ix: 0 };
    const token_from = { ix: 0, line: 0, line_ix: 0 };
    const token_to = { ix: 0, line: 0, line_ix: 0 };
    const source = () => ({
        from: {
            line: token_from.line,
            col: token_from.ix - token_from.line_ix,
        },
        to: { line: token_to.line, col: token_to.ix - token_to.line_ix },
    });
    const error = (expected, actual) => {
        throw new ParseError(source(), expected, actual.length > 30 ? actual.substring(0, 40) + "..." : actual);
    };
    const notKeyword = (token, expected) => {
        if ([...artifacts_1.Keywords].includes(token))
            error(expected, token);
    };
    const BLANKS = ["\t", " ", "\n"];
    const skipBlanksAndComments = () => {
        Object.assign(token_to, pos);
        while (pos.ix < code.length) {
            let char = code.charAt(pos.ix);
            if (char === "\n") {
                pos.line++;
                pos.line_ix = ++pos.ix;
            }
            else if (BLANKS.includes(char)) {
                pos.ix++;
            }
            else if (char === "#") {
                do {
                    pos.ix++;
                    char = code.charAt(pos.ix);
                } while (pos.ix < code.length && char !== "\n");
            }
            else
                break;
        }
    };
    const nextToken = () => {
        skipBlanksAndComments();
        let partial = "";
        let token = "";
        let char = "";
        Object.assign(token_from, pos);
        Object.assign(token_to, pos);
        while (pos.ix < code.length) {
            char = code.charAt(pos.ix);
            if ((char >= "a" && char <= "z") ||
                (char >= "A" && char <= "Z") ||
                (partial.length && char >= "0" && char <= "9")) {
                partial += char;
                token += char;
                pos.ix++;
            }
            else if (![",", ...BLANKS].includes(char)) {
                error("identifier", char);
            }
            else {
                skipBlanksAndComments();
                if (pos.ix < code.length) {
                    char = code.charAt(pos.ix);
                    if (char !== ",")
                        break;
                    partial = "";
                    token += char;
                    pos.ix++;
                    skipBlanksAndComments();
                }
            }
        }
        return { token, source: source() };
    };
    const parseStatement = (type) => {
        const { token: name, source } = nextToken();
        !name && error("name", "nothing");
        name.indexOf(",") > 0 && error("name", "names");
        notKeyword(name, "name");
        !statements.has(name) &&
            statements.set(name, {
                type: type.token,
                source: type.source,
                rels: new Map(),
            });
        const statement = statements.get(name);
        if (statement.type !== type.token)
            error(statement.type, type.token);
        statement.source.to = source.to;
        let next = nextToken();
        if (artifacts_1.ArtTypes.includes(next.token))
            return next; // declaration only
        const grammar = artifacts_1.artifacts[type.token].grammar;
        while (next.token in grammar) {
            const rel = grammar[next.token];
            const { token: names, source } = nextToken();
            !names && error("names", "nothing");
            names.split(",").forEach((n) => notKeyword(n.trim(), "names"));
            names
                .split(",")
                .filter(Boolean)
                .forEach((n) => statement?.rels.set(n, rel));
            statement.source.to = source.to;
            next = nextToken();
        }
        return next;
    };
    let next = nextToken();
    while (next.token.length) {
        if (artifacts_1.ArtTypes.includes(next.token))
            next = parseStatement(next);
        else if (next.token.length)
            error("keyword", next.token);
    }
    return statements;
};
exports.parse = parse;
//# sourceMappingURL=parser.js.map