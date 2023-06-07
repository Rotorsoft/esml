import { Field, Visual } from "./artifacts";
export type Node = {
    id: string;
    visual: Visual;
    ctx: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fields: Field[];
};
export declare const esml: (code: string, scale: number, font?: string) => {
    error?: Error;
    svg?: string;
    width?: number;
    height?: number;
    nodes?: Node[];
};
//# sourceMappingURL=esml.d.ts.map