import {
  Config,
  ContextNode,
  Edge,
  Node,
  Ref,
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
import { Graphics, Renderable } from "./types";

const pickFontSize = (words: string[], w: number) => {
  const wordLengths = words.map((w) => w.length);
  const maxWord = wordLengths.sort().at(-1) || 0;
  const pairLenghts =
    wordLengths.map((l, i) => (i ? wordLengths[i - 1] + l + 1 : l)) || 0;
  const maxPair = pairLenghts.sort().at(-1) || 0;
  const minSize = Math.floor(w / 8);
  const size1 = Math.max(Math.floor(w / maxWord), minSize);
  const size2 = Math.max(Math.floor(w / maxPair), minSize);
  return Math.floor(Math.min(size1, size2, 30));
};

const sizeText = (
  text: string[],
  w: number,
  h: number
): { lines: string[]; fontSize: number } => {
  let fontSize = pickFontSize(text, w);
  while (fontSize > 5) {
    const maxWidth = Math.floor(w / fontSize);
    const maxHeight = Math.floor(h / fontSize);
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

const renderText = (
  node: Node,
  text: string[],
  g: Graphics,
  config: Config,
  options: {
    fit: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fontSize?: number;
  } = { fit: true }
) => {
  const style = renderable(node.visual).style;
  const width = options.width || node.width || 0;
  const height = options.height || node.height || 0;

  const { lines, fontSize } = options.fit
    ? sizeText(text, width * config.font.widthScale, height * 0.8)
    : {
        lines: text,
        fontSize: options.fontSize || config.fontSize,
      };

  g.setFont(fontSize);
  const x = options.x || Math.floor(width / 2);
  const y = options.y || Math.floor(height / 2);
  const m = Math.floor(lines.length / 2);
  const h = config.font.heightScale;
  const o = lines.length % 2 ? h : h * 2;
  lines.forEach((line, i) => {
    g.fillText(line, x, y, style.stroke, `${(i - m) * 1.2 + o}em`);
  });
};

const getPath = (edge: Edge, config: Config): Vector[] => {
  const path = edge.path!.slice(1, -1);
  const endDir = normalize(difference(path[path.length - 2], path.at(-1)!));
  const size = (config.spacing * config.arrowSize) / 30;
  const end = path.length - 1;
  const copy = path.map((p) => ({ x: p.x, y: p.y }));
  copy[end] = add(copy[end], multiply(endDir, size * (edge.arrow ? 5 : 0)));
  return copy;
};

const renderArrow = (edge: Edge, g: Graphics, config: Config) => {
  if (edge.arrow) {
    const end = edge.path![edge.path!.length - 2];
    const path = edge.path!.slice(1, -1);
    const size = (config.spacing * config.arrowSize) / 30;
    const dir = normalize(difference(path[path.length - 2], path.at(-1)!));
    const x = (s: number) => add(end, multiply(dir, s * size));
    const y = (s: number) => multiply(rotate(dir), s * size);
    const circuit = [add(x(10), y(4)), x(5), add(x(10), y(-4)), end];
    g.fillStyle(config.stroke);
    g.circuit(circuit).fillAndStroke();
  }
};

const renderEdge = (edge: Edge, g: Graphics, config: Config) => {
  const path = getPath(edge, config);
  g.strokeStyle(config.stroke);
  if (edge.dashed) {
    g.group(0, 0);
    var dash = Math.max(4, 2 * config.lineWidth);
    g.setLineDash([dash, dash]);
    g.path(path).stroke();
    g.ungroup();
  } else g.path(path).stroke();
  renderArrow(edge, g, config);
};

const renderRefs = (
  context: ContextNode,
  refs: Ref[],
  g: Graphics,
  config: Config
) => {
  const align = refs.length > 1 ? "left" : "center";
  const text =
    refs.length > 1
      ? refs.map((r) => `- ${splitId(r.target.id).join(" ")}`)
      : splitId(refs[0].target.id);

  const { hostId, target } = refs[0];
  const host = context.nodes.get(hostId);
  if (!host) return;

  const x = Math.floor(host.x! - host.width! / 2 - config.scale * 0.2);
  const y = Math.floor(host.y! + host.height! * 0.4);
  const w = Math.floor(host.width!);
  const h = Math.floor(config.scale * 0.4);

  g.group(0, 0);
  {
    g.setData("name", `refs-${hostId}`);
    g.fillStyle(COLORS[target.visual]);
    g.textAlign(align);
    const style = "filter: drop-shadow(0px 5px 5px rgba(0, 0, 0, 0.5));";
    g.rect(x, y, w, h, style).fill();
    renderText(host, text, g, config, {
      fit: true,
      x: align === "center" ? x + w / 2 : x + config.scale * 0.05,
      y: y + h / 2,
      width: w,
      height: h,
    });
  }
  g.ungroup();
};

const context: Renderable = {
  style: {
    stroke: "#AAAAAA",
    fill: "white",
  },
  renderShape: (node: Node, g: Graphics) => {
    g.rect(0, 0, node.width!, node.height!).fillAndStroke();
  },
  renderContents: (node: Node, g: Graphics, config: Config) => {
    if (isContextNode(node)) {
      if (node.id) {
        const words = splitId(node.id);
        g.fillText(
          words.join(" "),
          config.fontSize * words.length,
          -config.fontSize,
          context.style.stroke
        );
      }
      g.group(config.padding, config.padding);
      {
        g.textAlign("center");
        node.edges.forEach((e) => renderEdge(e, g, config));
        node.nodes.forEach((n) => renderNode(n, g, config));
        node.refs.forEach((r) => renderRefs(node, [...r.values()], g, config));
      }
      g.ungroup();
    }
  },
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
const note = (visual: Visual): Renderable => ({
  style: {
    stroke: "#555555",
    fill: COLORS[visual],
  },
  renderShape: (node: Node, g: Graphics) => {
    const style = "filter: drop-shadow(0px 5px 5px rgba(0, 0, 0, 0.5));";
    g.rect(0, 0, node.width!, node.height!, style).fill();
  },
  renderContents: (node, g, config) =>
    renderText(node, splitId(node.id), g, config),
});

const renderable = (visual: Visual) =>
  visual === "context" ? context : note(visual);

const renderNode = (node: Node, g: Graphics, config: Config) => {
  const { style, renderShape, renderContents } = renderable(node.visual);
  const dx = Math.floor(node.x! - node.width! / 2);
  const dy = Math.floor(node.y! - node.height! / 2);
  g.group(dx, dy);
  {
    g.setData("name", node.id);
    g.fillStyle(style.fill);
    renderShape(node, g, config);
    renderContents(node, g, config);
  }
  g.ungroup();
};

export const render = (
  root: ContextNode,
  g: Graphics,
  config: Config
): void => {
  g.setData("name", "root");
  g.setFontFamily(config.font.family);
  g.setFont(config.fontSize);
  g.textAlign("left");
  g.lineWidth(config.lineWidth);
  context.renderContents(root, g, config);
};
