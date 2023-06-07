import { Vector } from "../utils";
export type Style = {
    scale: number;
    margin: number;
    padding: number;
    stroke: string;
    fill: string;
    font: string;
    fontSize: number;
};
export declare const ArtTypes: readonly ["context", "actor", "aggregate", "system", "projector", "policy", "process", "schema"];
declare const Messages: readonly ["command", "event"];
declare const Visuals: readonly ["context", "actor", "aggregate", "system", "projector", "policy", "process", "schema", "command", "event"];
declare const Actions: readonly ["invokes", "handles", "emits", "includes", "reads", "requires", "optional"];
export declare const Keywords: readonly ["context", "actor", "aggregate", "system", "projector", "policy", "process", "schema", "invokes", "handles", "emits", "includes", "reads", "requires", "optional"];
export type ArtType = (typeof ArtTypes)[number];
export type Message = (typeof Messages)[number];
export type Visual = (typeof Visuals)[number];
export type Action = (typeof Actions)[number];
export type Keyword = (typeof Keywords)[number];
export type RelType = Message | "projector" | "field";
export declare const COLORS: {
    [key in Visual]: string;
};
type Rel = {
    source: Node;
    target: Node;
    edge?: boolean;
    color?: string;
    arrow?: boolean;
};
export type FieldType = "string" | "number" | string;
export type Field = {
    name: string;
    required: boolean;
    type: FieldType;
    size?: number;
};
export type Node = {
    id: string;
    visual: Visual;
    ctx?: string;
    schema?: Map<string, Field>;
    color?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
};
export type Edge = Rel & {
    path?: Vector[];
};
export type ContextNode = Node & {
    visual: "context";
    nodes: Map<string, Node>;
    edges: Map<string, Edge>;
    refs: Map<string, Set<Node>>;
    actors?: ContextNode;
};
export declare const isContextNode: (node: Node) => node is ContextNode;
type Rule = {
    type?: RelType;
    owns?: boolean;
};
export type Artifact = {
    grammar: {
        [key in Action]?: Rule;
    };
    rel: (source: Node, target: Node, root: ContextNode) => Rel | undefined;
};
export type Source = {
    readonly from: {
        readonly line: number;
        readonly col: number;
    };
    to: {
        line: number;
        col: number;
    };
};
export type Statement = {
    type: ArtType;
    source: Source;
    rels: Map<string, Rule & {
        action: Action;
        schema: boolean;
    }>;
    context?: string;
};
export {};
//# sourceMappingURL=types.d.ts.map