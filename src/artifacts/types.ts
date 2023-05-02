import { Graphics } from "../graphics/types";
import { Vector } from "../utils";

export interface Config {
  padding: number;
  stroke: string;
  font: string;
  leading: number;
  fontSize: number;
  lineWidth: number;
  gutter: number;
  background: string;
  edgeMargin: number;
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

interface TextStyle {
  bold: boolean;
  italic: boolean;
  center: boolean;
  color: string;
}

interface Style {
  body: TextStyle;
  fill: string;
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

export interface Node {
  id: string;
  visual: Visual;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  offset?: { x: number; y: number };
  nodes?: Map<string, Node>;
  edges?: Set<Edge>;
}

const Edges = ["invokes", "handles", "emits", "includes"] as const;
export type EdgeType = (typeof Edges)[number];
export const Keywords = [...Types, ...Edges] as const;
export type Keyword = (typeof Keywords)[number];

export type Grammar = { [key in EdgeType]?: Message | "artifacts" };

export interface Renderable {
  style: Style;
  layout: (node: Node, config: Config) => void;
  render: (node: Node, g: Graphics, x: number, y: number) => void;
}

export interface Artifact extends Renderable {
  grammar: () => Grammar;
  edge: (node: Node, message: Node, dashed?: boolean, arrow?: boolean) => Edge;
}

export const square = (node: Node, config: Config) => {
  node.x = 0;
  node.y = 0;
  node.width = config.scale;
  node.height = config.scale;
  node.offset = { x: 8, y: 8 };
};

export const rectangle = (node: Node, config: Config) => {
  node.x = 0;
  node.y = 0;
  node.width = config.scale * 2;
  node.height = config.scale;
  node.offset = { x: 8, y: 8 };
};

const COLORS: { [key in Visual]: string } = {
  context: "white",
  actor: "white",
  aggregate: "#fffabb",
  system: "#eca0c3",
  projector: "#d5f694",
  policy: "#c595cd",
  process: "#c595cd",
  command: "#7adcfb",
  event: "#ffaa61",
};

export const noteStyle = (visual: Visual) => ({
  body: {
    bold: false,
    italic: false,
    center: true,
    color: "#555555",
  },
  fill: COLORS[visual],
});

export const noteRender = (node: Node, g: Graphics, x: number, y: number) => {
  g.rect(
    x,
    y,
    node.width!,
    node.height!,
    "filter: drop-shadow(0px 5px 5px rgba(0, 0, 0, 0.5));"
  ).fill();
};
