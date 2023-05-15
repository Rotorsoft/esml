import {
  COLORS,
  ContextNode,
  Edge,
  Node,
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
import { Graphics, Renderable, SvgAttrs } from "./types";

const CTX_STROKE = "#AAAAAA";
const NOTE_STROKE = "#555555";
const ARROW_SIZE = 0.5;

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
    lines: [text.join(" ")],
    fontSize,
  };
};

const renderText = (
  text: string[],
  w: number,
  h: number,
  g: Graphics,
  options: {
    fit: boolean;
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    fontSize?: number;
  } = { fit: true }
) => {
  const width = options.w || w || 0;
  const height = options.h || h || 0;

  const { lines, fontSize } = options.fit
    ? sizeText(text, width, height)
    : {
        lines: text,
        fontSize: options.fontSize || 12,
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

const getPath = (edge: Edge, style: Style): Vector[] => {
  const path = edge.path!.slice(1, -1);
  const endDir = normalize(difference(path[path.length - 2], path.at(-1)!));
  const size = (style.margin * ARROW_SIZE) / 30;
  const end = path.length - 1;
  const copy = path.map((p) => ({ x: p.x, y: p.y }));
  copy[end] = add(copy[end], multiply(endDir, size * (edge.arrow ? 5 : 0)));
  return copy;
};

const renderEdge = (edge: Edge, g: Graphics, style: Style) => {
  const attrs: SvgAttrs = { fill: "none", stroke: edge.color };
  const stroke_dash = edge.dashed && { "stroke-dasharray": `4 4` };
  g.path(getPath(edge, style), false, { ...attrs, ...stroke_dash });
  if (edge.arrow) {
    const end = edge.path![edge.path!.length - 2];
    const path = edge.path!.slice(1, -1);
    const size = (style.margin * ARROW_SIZE) / 30;
    const dir = normalize(difference(path[path.length - 2], path.at(-1)!));
    const x = (s: number) => add(end, multiply(dir, s * size));
    const y = (s: number) => multiply(rotate(dir), s * size);
    g.path([add(x(10), y(4)), x(5), add(x(10), y(-4)), end], true, {
      ...attrs,
      fill: edge.color,
    });
  }
};

const renderRef = (
  target: Node,
  x: number,
  y: number,
  w: number,
  h: number,
  g: Graphics
) => {
  g.group("").attr("fill", COLORS[target.visual]);
  g.rect(x, y, w, h);
  renderText(splitId(target.id), w, h, g, {
    fit: true,
    x: x + w / 2,
    y: y + h / 2,
    w,
    h,
  });
  g.ungroup();
};

const renderSimpleRef = (
  ctx: ContextNode,
  target: Node,
  x: number,
  y: number,
  w: number,
  h: number,
  g: Graphics
) => {
  renderRef(target, x, y, w, h, g);
  const subRefs = [...ctx.refs.values()].filter(
    (ref) => ref.sourceId === target.id
  );
  subRefs.forEach((sr, i) =>
    renderRef(sr.target, x - w * 0.4, y + h * i - 4, w / 2, h / 2, g)
  );
};

const renderMultiRef = (
  targets: Node[],
  x: number,
  y: number,
  w: number,
  h: number,
  g: Graphics
) => {
  const text = targets.map((target) => `- ${splitId(target.id).join(" ")}`);
  g.group("")
    .attr("fill", COLORS[targets[0].visual])
    .attr("text-align", "left")
    .attr("text-anchor", "start");
  g.rect(x, y, w, h);
  renderText(text, w, h, g, {
    fit: true,
    x: x + 4,
    y: y + h / 2,
    w,
    h,
  });
  g.ungroup();
};

const renderCommandRefs = (
  ctx: ContextNode,
  targets: Node[],
  x: number,
  y: number,
  w: number,
  h: number,
  g: Graphics
) => {
  const th = Math.floor(h / targets.length);
  targets.forEach((target, i) =>
    renderSimpleRef(ctx, target, x, y + i * (th + 2), w, th, g)
  );
};

const renderRefs = (ctx: ContextNode, g: Graphics, style: Style) => {
  const bySource = new Map<string, Node[]>();
  ctx.refs.forEach((ref) => {
    !bySource.has(ref.sourceId) && bySource.set(ref.sourceId, []);
    bySource.get(ref.sourceId)?.push(ref.target);
  });
  bySource.forEach((targets, sourceId) => {
    const source = ctx.nodes.get(sourceId)!;
    if (source.visual !== "actor") {
      const x = Math.floor(source.x! - source.width! / 2 - style.scale * 0.2);
      const y = Math.floor(source.y! + source.height! * 0.4);
      const w = Math.floor(style.scale);
      const h = Math.floor(style.scale / 2);
      targets.length > 1
        ? source.visual === "command"
          ? renderCommandRefs(ctx, targets, x, y, w, h, g)
          : renderMultiRef(targets, x, y, w, h, g)
        : renderSimpleRef(ctx, targets[0], x, y, w, h, g);
    }
  });
};

const context: Renderable = (ctx: Node, g: Graphics, style: Style) => {
  if (isContextNode(ctx)) {
    if (ctx.id) {
      const words = splitId(ctx.id);
      g.text(words.join(" "), 0, 0, {
        fill: CTX_STROKE,
        stroke: CTX_STROKE,
        dy: -style.fontSize,
      });
      g.rect(0, 0, ctx.width!, ctx.height!, { rx: 25, ry: 25 });
    }
    g.group("", { dx: style.padding, dy: style.padding });
    if (ctx.id)
      g.attr("text-align", "center")
        .attr("text-anchor", "middle")
        .attr("stroke", NOTE_STROKE)
        .attr("stroke-width", 1);
    ctx.edges.forEach((e) => e.color && renderEdge(e, g, style));
    ctx.nodes.forEach((n) => n.visual !== "actor" && renderNode(n, g, style));
    renderRefs(ctx, g, style);
    g.ungroup();
  }
};

const note =
  (visual: Visual): Renderable =>
  (node: Node, g: Graphics, style: Style) => {
    g.attr("fill", COLORS[visual]);
    g.rect(0, 0, node.width!, node.height!);
    renderText(splitId(node.id), node.width!, node.height!, g);
  };

const renderNode = (node: Node, g: Graphics, style: Style) => {
  const dx = Math.floor(node.x! - node.width! / 2);
  const dy = Math.floor(node.y! - node.height! / 2);
  const render = node.visual === "context" ? context : note(node.visual);
  g.group(node.id, { class: node.visual, dx, dy });
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
    "stroke-width": 1.5,
  });
  context(root, g, style);
  return g.serialize();
};
