import {
  ContextNode,
  Edge,
  Node,
  Ref,
  Style,
  Visual,
  isContextNode,
} from "../artifacts";
import {
  Vector,
  add,
  difference,
  multiply,
  normalize,
  rotate,
  splitId,
} from "../utils";
import { SvgGraphics } from "./SvgGraphics";
import { Graphics, Renderable } from "./types";

const pickFontSize = (words: string[], w: number) => {
  const max = words
    .map((word) => word.length)
    .sort((a, b) => b - a)
    .at(0)!;
  return Math.floor(Math.min(Math.max(Math.ceil(w / max), 8), 24));
};

const sizeText = (
  text: string[],
  w: number,
  h: number
): { lines: string[]; fontSize: number } => {
  let fontSize = pickFontSize(text, w);
  while (fontSize > 5) {
    const maxWidth = Math.ceil(w / fontSize) - 1;
    const maxHeight = Math.floor(h / fontSize) - 1;
    const lines: string[] = [];
    let line = text[0];
    let n = 1;
    while (n < text.length) {
      const word = text[n++];
      if (line.length + word.length >= maxWidth) {
        lines.push(line);
        line = word;
      } else line = line.concat(line.length ? " " : "", word);
    }
    lines.push(line);
    if (n === text.length && lines.length <= maxHeight)
      return {
        lines,
        fontSize,
      };
    fontSize--;
  }
  return {
    lines: text,
    fontSize,
  };
};

const NOTE_STROKE = "#555555";
const renderText = (
  node: Node,
  text: string[],
  g: Graphics,
  style: Style,
  options: {
    fit: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fontSize?: number;
  } = { fit: true }
) => {
  const width = options.width || node.width || 0;
  const height = options.height || node.height || 0;

  const { lines, fontSize } = options.fit
    ? sizeText(text, width, height)
    : {
        lines: text,
        fontSize: options.fontSize || style.fontSize,
      };

  g.attr("font-size", fontSize + "pt");
  const x = options.x || Math.floor(width / 2);
  const y = options.y || Math.floor(height / 2);
  const m = Math.floor(lines.length / 2);
  const o = lines.length % 2 ? 0.3 : 0.9;
  lines.forEach((line, i) => {
    g.text(line, x, y, {
      fill: NOTE_STROKE,
      dy: `${((i - m) * 1.2 + o).toFixed(2)}em`,
    });
  });
};

const ARROW_SIZE = 0.5;
const getPath = (edge: Edge, style: Style): Vector[] => {
  const path = edge.path!.slice(1, -1);
  const endDir = normalize(difference(path[path.length - 2], path.at(-1)!));
  const size = (style.margin * ARROW_SIZE) / 30;
  const end = path.length - 1;
  const copy = path.map((p) => ({ x: p.x, y: p.y }));
  copy[end] = add(copy[end], multiply(endDir, size * (edge.arrow ? 5 : 0)));
  return copy;
};

const renderArrow = (edge: Edge, g: Graphics, style: Style) => {
  if (edge.arrow) {
    const end = edge.path![edge.path!.length - 2];
    const path = edge.path!.slice(1, -1);
    const size = (style.margin * ARROW_SIZE) / 30;
    const dir = normalize(difference(path[path.length - 2], path.at(-1)!));
    const x = (s: number) => add(end, multiply(dir, s * size));
    const y = (s: number) => multiply(rotate(dir), s * size);
    g.path([add(x(10), y(4)), x(5), add(x(10), y(-4)), end], { close: true });
  }
};

const renderEdge = (edge: Edge, g: Graphics, style: Style) => {
  g.path(
    getPath(edge, style),
    (edge.dashed && { dash: Math.max(4, 2 * style.strokeWidth) }) || undefined
  );
  renderArrow(edge, g, style);
};

const renderRefs = (
  context: ContextNode,
  refs: Ref[],
  g: Graphics,
  style: Style
) => {
  const align = refs.length > 1 ? "left" : "center";
  const text =
    refs.length > 1
      ? refs.map((r) => `- ${splitId(r.target.id).join(" ")}`)
      : splitId(refs[0].target.id);

  const { hostId, target } = refs[0];
  const host = context.nodes.get(hostId);
  if (!host) return;

  const x = Math.floor(host.x! - host.width! / 2 - style.scale * 0.2);
  const y = Math.floor(host.y! + host.height! * 0.4);
  const w = Math.floor(style.scale);
  const h = Math.floor(style.scale / 2);

  g.group(`refs-${hostId}`)
    .attr("fill", COLORS[target.visual])
    .attr("stroke", NOTE_STROKE)
    .attr("text-align", align)
    .attr("text-anchor", align === "center" ? "middle" : "start");
  const shadow = "filter: drop-shadow(0px 5px 5px rgba(0, 0, 0, 0.5));";
  g.rect(x, y, w, h, { stroke: "none", style: shadow });
  renderText(host, text, g, style, {
    fit: true,
    x: align === "center" ? x + w / 2 : x + style.scale * 0.05,
    y: y + h / 2,
    width: w,
    height: h,
  });
  g.ungroup();
};

const CTX_STROKE = "#AAAAAA";
const context: Renderable = (node: Node, g: Graphics, style: Style) => {
  if (isContextNode(node)) {
    if (node.id) {
      const words = splitId(node.id);
      g.text(words.join(" "), 0, 0, {
        fill: CTX_STROKE,
        stroke: CTX_STROKE,
        dy: -style.fontSize,
      });
      g.rect(0, 0, node.width!, node.height!);
    }
    g.group("", style.padding, style.padding);
    if (node.id) g.attr("text-align", "center").attr("text-anchor", "middle");
    node.edges.forEach((e) => e.render && renderEdge(e, g, style));
    node.nodes.forEach((n) => renderNode(n, g, style));
    node.refs.forEach((r) => renderRefs(node, [...r.values()], g, style));
    g.ungroup();
  }
};

const COLORS: { [key in Visual]: string } = {
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
const note =
  (visual: Visual): Renderable =>
  (node: Node, g: Graphics, style: Style) => {
    const shadow = "filter: drop-shadow(0px 5px 5px rgba(0, 0, 0, 0.5));";
    g.attr("fill", COLORS[visual]).attr("stroke", NOTE_STROKE);
    g.rect(0, 0, node.width!, node.height!, { stroke: "none", style: shadow });
    renderText(node, splitId(node.id), g, style);
  };

const renderNode = (node: Node, g: Graphics, style: Style) => {
  const dx = Math.floor(node.x! - node.width! / 2);
  const dy = Math.floor(node.y! - node.height! / 2);
  const render = node.visual === "context" ? context : note(node.visual);
  g.group(node.id, dx, dy);
  render(node, g, style);
  g.ungroup();
};

export const render = (root: ContextNode, style: Style): string => {
  const g = new SvgGraphics({
    fill: style.fill,
    "font-family": style.font,
    "font-size": style.fontSize + "pt",
    "text-align": "left",
    stroke: style.stroke,
    "stroke-width": style.strokeWidth,
  });
  context(root, g, style);
  return g.serialize();
};
