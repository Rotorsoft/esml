import { Source, Statement } from "./artifacts";
export declare class ParseError extends Error {
    readonly source: Source;
    readonly expected: string;
    readonly actual: string;
    constructor(source: Source, expected: string, actual: string);
}
export declare const parse: (code: string) => Map<string, Statement>;
//# sourceMappingURL=parser.d.ts.map