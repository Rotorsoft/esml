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

export const ArtTypes = [
  "context",
  "actor",
  "aggregate",
  "system",
  "projector",
  "policy",
  "process",
  "schema",
] as const;
const Messages = ["command", "event"] as const;
const Visuals = [...ArtTypes, ...Messages] as const;
const Actions = [
  "invokes",
  "handles",
  "emits",
  "includes",
  "reads",
  "requires",
  "optional",
] as const;
export const Keywords = [...ArtTypes, ...Actions] as const;

export type ArtType = (typeof ArtTypes)[number];
export type Message = (typeof Messages)[number];
export type Visual = (typeof Visuals)[number];
export type Action = (typeof Actions)[number];
export type Keyword = (typeof Keywords)[number];
export type RelType = Message | "projector" | "field";

export const COLORS: { [key in Visual]: string } = {
  context: "white",
  actor: "#ffc107",
  aggregate: "#fffabb",
  system: "#eca0c3",
  projector: "#d5f694",
  policy: "#c595cd",
  process: "#c595cd",
  command: "#7adcfb",
  event: "#ffaa61",
  schema: "transparent",
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

export const isContextNode = (node: Node): node is ContextNode =>
  "nodes" in node;

type Rule = { type?: RelType; owns?: boolean };

export type Artifact = {
  grammar: { [key in Action]?: Rule };
  rel: (source: Node, target: Node, root: ContextNode) => Rel | undefined;
};

export type Source = {
  readonly from: { readonly line: number; readonly col: number };
  to: { line: number; col: number };
};

export type Statement = {
  type: ArtType;
  source: Source;
  rels: Map<string, Rule & { action: Action; schema: boolean }>;
  context?: string;
};
