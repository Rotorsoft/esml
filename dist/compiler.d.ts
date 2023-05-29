import { ContextNode, Source, Statement } from "./artifacts";
export declare class CompilerError extends Error {
    readonly source: Source;
    readonly expected: string;
    readonly actual: string;
    constructor(source: Source, expected: string, actual: string);
}
export declare const compile: (statements: Map<string, Statement>) => ContextNode;
//# sourceMappingURL=compiler.d.ts.map