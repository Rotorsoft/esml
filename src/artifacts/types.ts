import { Vector } from "../utils";
export interface Config {
  padding: number;
  stroke: string;
  font: { family: string; widthScale: number; heightScale: number };
  leading: number;
  fontSize: number;
  lineWidth: number;
  background: string;
  gravity: number;
  spacing: number;
  arrowSize: number;
  scale: number;
}

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
export type Message = (typeof Messages)[number];
const Visuals = [...Types, ...Messages] as const;
export type Visual = (typeof Visuals)[number];

const Edges = ["invokes", "handles", "emits", "includes"] as const;
export type EdgeType = (typeof Edges)[number];
export const Keywords = [...Types, ...Edges] as const;
export type Keyword = (typeof Keywords)[number];

export type Grammar = { [key in EdgeType]?: Message | "artifacts" };

export interface Artifact {
  grammar: () => Grammar;
  layout: (node: Node, config: Config) => void;
  edge: (
    node: Node,
    ref: Node,
    dashed?: boolean,
    arrow?: boolean
  ) => Edge | undefined;
  ref: (node: Node, ref: Node) => Ref | undefined;
}

export interface Edge {
  start: string;
  end: string;
  dashed: boolean;
  arrow: boolean;
  path?: Vector[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface Ref {
  id: string;
  refid: string;
}

export interface Node {
  id: string;
  visual: Visual;
  artifact?: Artifact;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface ContextNode extends Node {
  visual: "context";
  nodes: Map<string, Node>;
  edges: Set<Edge>;
  refs: Set<Ref>;
}

export const isContextNode = (node: Node): node is ContextNode =>
  "nodes" in node;
