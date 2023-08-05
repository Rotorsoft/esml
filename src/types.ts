import { Vector } from "./utils";

export type Style = {
  scale: number;
  margin: number;
  padding: number;
  stroke: string;
  fill: string;
  font: string;
  fontSize: number;
};

export const Visuals = [
  "context",
  "aggregate",
  "system",
  "projector",
  "policy",
  "process",
  "command",
  "event",
  "actor",
] as const;
export const Actions = [
  "invokes",
  "handles",
  "emits",
  "includes",
  "requires",
  "optional",
] as const;
export type Visual = (typeof Visuals)[number];
export type Action = (typeof Actions)[number];

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
};

export const ScalarFieldTypes = [
  "string",
  "number",
  "boolean",
  "uuid",
  "date",
] as const;

export type FieldType = (typeof ScalarFieldTypes)[number] | Schema;
export class Field {
  constructor(
    readonly name: string,
    readonly required: boolean,
    readonly type: FieldType,
    readonly size?: number
  ) {}
}

export class Schema extends Map<string, Field> {
  constructor(readonly id: string, readonly description?: string) {
    super();
  }
  toString() {
    return this.id;
  }
}

export type Edge = {
  source: Node;
  target: Node;
  color?: string;
  arrow?: boolean;
  path?: Vector[];
};

export type Node = {
  id: string;
  visual: Visual;
  ctx: ContextNode;
  description?: string;
  color?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  refs?: Set<Node>;
};

export type ContextNode = Node & {
  visual: "context";
  nodes: Map<string, Node>;
  edges: Map<string, Edge>;
  schemas: Map<string, Schema>;
};

export const isContextNode = (node: Node): node is ContextNode =>
  "nodes" in node;

export type Edger = (
  source: Node,
  target: Node,
  root: ContextNode
) => Edge | undefined;
