import { Config, Edge, Node, Visual } from "../artifacts";
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

const sizeText = (node: Node): { lines: string[]; fontSize: number } => {
  const words = splitId(node.id);
  const maxWord = words.reduce((max, word) => Math.max(max, word.length), 0);
  let fontSize = Math.max(Math.min(Math.ceil(node.width! / maxWord), 24), 8);
  while (fontSize > 8) {
    const maxWidth = Math.floor(node.width! / fontSize);
    const maxHeight = Math.floor(node.height! / fontSize);
    const lines: string[] = [];
    let line = words[0];
    let n = 1;
    while (n < words.length) {
      const word = words[n++];
      if (line.length + word.length >= maxWidth) {
        lines.push(line);
        line = word;
      } else line = line.concat(line.length ? " " : "", word);
    }
    lines.push(line);
    if (n === words.length && lines.length < maxHeight)
      return {
        lines,
        fontSize,
      };
    fontSize--;
  }
  return {
    lines: words,
    fontSize,
  };
};

const renderLines = (
  lines: string[],
  g: Graphics,
  fontSize: number,
  width: number,
  height: number,
  padding: number
) => {
  g.setFont(fontSize, "normal", "normal");
  g.textAlign("center");
  const lineHeight = fontSize * 1.15;
  const topMargin = (fontSize + height - lines.length * lineHeight) / 2;
  const x = width / 2 - padding;
  lines.forEach((line, i) => {
    const y = topMargin + i * lineHeight;
    g.fillText(line, x, y);
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
    var dash = Math.max(4, 2 * config.lineWidth);
    g.group();
    {
      g.setLineDash([dash, dash]);
      g.path(path).stroke();
    }
    g.ungroup();
  } else g.path(path).stroke();
  renderArrow(edge, g, config);
};

const context: Renderable = {
  style: {
    stroke: "#CCCCCC",
    fill: "white",
  },
  renderShape: (node: Node, g: Graphics, x: number, y: number) => {
    node.id && g.rect(x, y, node.width!, node.height!).fillAndStroke();
  },
  renderContents: (node: Node, g: Graphics, config: Config) => {
    g.setFont(config.fontSize, "normal", "normal");
    g.textAlign("left");
    const x = 0;
    const y = config.fontSize;
    g.fillText(splitId(node.id).join(" "), x, y);

    g.group();
    g.translate(config.gutter, config.gutter);
    node.edges!.forEach((r) => renderEdge(r, g, config));
    node.nodes!.forEach((n) => renderNode(n, g, config));
    g.ungroup();
  },
};

const actor: Renderable = {
  style: {
    stroke: "#555555",
    fill: "white",
  },
  renderShape: (
    node: Node,
    g: Graphics,
    x: number,
    y: number,
    config: Config
  ) => {
    const a = config.padding / 2;
    const yp = y + a * 4;
    const faceCenter = { x: node.x!, y: yp - a };
    g.circle(faceCenter, a).stroke();
    g.path([
      { x: node.x!, y: yp },
      { x: node.x!, y: yp + 2 * a },
    ]).stroke();
    g.path([
      { x: node.x! - a, y: yp + a },
      { x: node.x! + a, y: yp + a },
    ]).stroke();
    g.path([
      { x: node.x! - a, y: yp + a + config.padding },
      { x: node.x!, y: yp + config.padding },
      { x: node.x! + a, y: yp + a + config.padding },
    ]).stroke();
  },
  renderContents: (node: Node, g: Graphics, config: Config) => {
    const lines = splitId(node.id);
    renderLines(
      lines,
      g,
      config.fontSize,
      node.width!,
      node.height!,
      config.padding
    );
  },
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
const note = (visual: Visual): Renderable => ({
  style: {
    stroke: "#555555",
    fill: COLORS[visual],
  },
  renderShape: (node: Node, g: Graphics, x: number, y: number) => {
    const style = "filter: drop-shadow(0px 5px 5px rgba(0, 0, 0, 0.5));";
    g.rect(x, y, node.width!, node.height!, style).fill();
  },
  renderContents: (node: Node, g: Graphics, config: Config) => {
    const { lines, fontSize } = sizeText(node);
    renderLines(lines, g, fontSize, node.width!, node.height!, config.padding);
  },
});

const renderable = (visual: Visual) => {
  if (visual === "context") return context;
  if (visual === "actor") return actor;
  return note(visual);
};

const renderNode = (node: Node, g: Graphics, config: Config) => {
  const { style, renderShape, renderContents } = renderable(node.visual);
  const x = node.x! - node.width! / 2;
  const y = node.y! - node.height! / 2;
  g.group();
  {
    g.setData("name", node.id);
    g.group();
    {
      g.fillStyle(style.fill);
      g.strokeStyle(style.stroke);
      renderShape(node, g, x, y, config);
    }
    g.ungroup();
    g.group();
    {
      node.id && g.translate(x, y);
      g.group();
      {
        g.translate(node.offset!.x, node.offset!.y);
        g.fillStyle(style.stroke);
        renderContents(node, g, config);
      }
      g.ungroup();
    }
    g.ungroup();
  }
  g.ungroup();
};

export const renderRoot = (root: Node, g: Graphics, config: Config): void => {
  g.group();
  {
    g.clear();
    g.group();
    {
      g.strokeStyle("transparent");
      g.fillStyle(config.background);
      g.rect(0, 0, root.width!, root.height!).fill();
    }
    g.ungroup();
    g.setFontFamily(config.font);
    g.lineWidth(config.lineWidth);
    g.lineJoin("round");
    g.lineCap("round");
    renderNode(root, g, config);
  }
  g.ungroup();
};
