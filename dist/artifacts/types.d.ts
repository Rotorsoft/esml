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
export declare const ArtTypes: readonly ["context", "actor", "aggregate", "system", "projector", "policy", "process"];
declare const Messages: readonly ["command", "event"];
declare const Visuals: readonly ["context", "actor", "aggregate", "system", "projector", "policy", "process", "command", "event"];
declare const Actions: readonly ["invokes", "handles", "emits", "includes", "reads"];
export declare const Keywords: readonly ["context", "actor", "aggregate", "system", "projector", "policy", "process", "invokes", "handles", "emits", "includes", "reads"];
export type ArtType = (typeof ArtTypes)[number];
export type Message = (typeof Messages)[number];
export type Visual = (typeof Visuals)[number];
export type Action = (typeof Actions)[number];
export type Keyword = (typeof Keywords)[number];
export type RelType = Message | "projector" | "artifact";
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
export type Node = {
    id: string;
    visual: Visual;
    ctx?: string;
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
    visual: RelType;
    owns: boolean;
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
    rels: Map<string, Rule>;
    context?: string;
};
export {};
//# sourceMappingURL=types.d.ts.map