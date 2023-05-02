import { Config, Edge, Node, visual } from "../artifacts";
import {
  Vector,
  add,
  difference,
  multiply,
  normalize,
  splitId,
} from "../utils";
import { drawArrow } from "./arrow";
import { Graphics } from "./types";

const getPath = (edge: Edge, config: Config): Vector[] => {
  const path = edge.path!.slice(1, -1);
  const endDir = normalize(difference(path[path.length - 2], path.at(-1)!));
  const size = (config.spacing * config.arrowSize) / 30;
  const end = path.length - 1;
  const copy = path.map((p) => ({ x: p.x, y: p.y }));
  copy[end] = add(copy[end], multiply(endDir, size * (edge.arrow ? 5 : 0)));
  return copy;
};

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

export const render = (root: Node, g: Graphics, config: Config): void => {
  const renderContents = (node: Node) => {
    const style = visual(node.visual).style;
    g.group();
    g.translate(node.offset!.x, node.offset!.y);
    g.fillStyle(style.body.color);
    if (node.visual !== "context") {
      const { lines, fontSize } = sizeText(node);
      g.setFont(
        fontSize,
        style.body.bold ? "bold" : "normal",
        style.body.italic ? "italic" : "normal"
      );
      const lineHeight = fontSize * 1.15;
      const topMargin =
        (fontSize + node.height! - lines.length * lineHeight) / 2;
      lines.forEach((line, i) => {
        g.textAlign(style.body.center ? "center" : "left");
        const x = style.body.center ? node.width! / 2 - config.padding : 0;
        const y = topMargin + i * lineHeight;
        g.fillText(line, x, y);
      });
    } else {
      g.setFont(
        config.fontSize,
        style.body.bold ? "bold" : "normal",
        style.body.italic ? "italic" : "normal"
      );
      g.textAlign(style.body.center ? "center" : "left");
      const x = style.body.center ? node.width! / 2 - config.padding : 0;
      const y = config.fontSize;
      g.fillText(splitId(node.id).join(" "), x, y);

      g.group();
      g.translate(config.gutter, config.gutter);
      node.edges!.forEach((r) => renderEdge(r));
      node.nodes!.forEach((n) => renderNode(n));
      g.ungroup();
    }
    g.ungroup();
  };

  const renderNode = (node: Node) => {
    const x = node.x! - node.width! / 2;
    const y = node.y! - node.height! / 2;

    g.group();
    g.setData("name", node.id);

    g.group();
    const { style, render } = visual(node.visual);
    g.fillStyle(style.fill);
    g.strokeStyle(style.body.color);
    render(node, g, x, y);
    g.ungroup();

    g.group();
    node.id && g.translate(x, y);
    renderContents(node);
    g.ungroup();

    g.ungroup();
  };

  const renderEdge = (edge: Edge) => {
    const path = getPath(edge, config);
    g.strokeStyle(config.stroke);
    if (edge.dashed) {
      var dash = Math.max(4, 2 * config.lineWidth);
      g.group();
      g.setLineDash([dash, dash]);
      g.path(path).stroke();
      g.ungroup();
    } else g.path(path).stroke();
    drawArrow(edge, g, config);
  };

  g.group();
  g.clear();

  g.group();
  g.strokeStyle("transparent");
  g.fillStyle(config.background);
  g.rect(0, 0, root.width!, root.height!).fill();
  g.ungroup();

  g.setFontFamily(config.font);
  g.setFont(config.fontSize, "bold", "normal");
  g.lineWidth(config.lineWidth);
  g.lineJoin("round");
  g.lineCap("round");

  renderNode(root);

  g.ungroup();
};
