import { Vector } from "../utils";

export type Font = { family: string; heightScale: number };
export type Config = {
  padding: number;
  stroke: string;
  font: Font;
  leading: number;
  fontSize: number;
  lineWidth: number;
  background: string;
  gravity: number;
  spacing: number;
  arrowSize: number;
  scale: number;
};

export const Types = [
  "context",
  "actor",
  "aggregate",
  "system",
  "projector",
  "policy",
  "process",
] as const;
export type Type = (typeof Types)[number];

const Messages = ["command", "event"] as const;
const Visuals = [...Types, ...Messages] as const;
const Actions = ["invokes", "handles", "emits", "includes", "reads"] as const;
export const Keywords = [...Types, ...Actions] as const;

export type Message = (typeof Messages)[number];
export type Visual = (typeof Visuals)[number];
export type VisualRel = Message | "projector" | "artifact";
export type Action = (typeof Actions)[number];
export type Keyword = (typeof Keywords)[number];
export type Rel = { visual: VisualRel; owns: boolean };

export type Grammar = { [key in Action]?: Rel };
export type Edger = (
  node: Node,
  ref: Node,
  dashed?: boolean,
  arrow?: boolean
) => Edge | undefined;
export type Referrer = (node: Node, ref: Node) => Ref | undefined;

export interface Artifact {
  grammar: () => Grammar;
  edge: Edger;
  ref: Referrer;
}
export type Artifacts = { [key in Type]: Artifact };

export type Edge = {
  start: string;
  end: string;
  dashed: boolean;
  arrow: boolean;
  path?: Vector[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export type Ref = {
  hostId: string;
  target: Node;
};

export type Node = {
  id: string;
  visual: Visual;
  ctx?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export type ContextNode = Node & {
  visual: "context";
  nodes: Map<string, Node>;
  edges: Set<Edge>;
  refs: Map<string, Map<string, Ref>>;
};

export const isContextNode = (node: Node): node is ContextNode =>
  "nodes" in node;
