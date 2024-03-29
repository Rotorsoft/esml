import * as dagre from "dagre";
import type { ContextNode, Node, Style, Visual } from "../types";
import { splitName } from "../utils";

type Layouter = (node: Node, style: Style) => void;

const square: Layouter = (node: Node, style: Style) => {
  node.x = 0;
  node.y = 0;
  node.width = style.scale;
  node.height = style.scale;
};

const rectangle: Layouter = (node: Node, style: Style) => {
  node.x = 0;
  node.y = 0;
  node.width = style.scale * 2;
  node.height = style.scale;
};

// don't render actors as nodes
const actor: Layouter = (node: Node) => {
  node.x = 0;
  node.y = 0;
  node.width = 0;
  node.height = 0;
};

export const layout = (root: ContextNode, style: Style) => {
  function layouter(visual: Visual): Layouter {
    switch (visual) {
      case "context":
        return layoutContext as Layouter;
      case "actor":
        return actor;
      case "command":
      case "event":
        return square;
      default:
        return rectangle;
    }
  }

  const PAD = 2 * style.padding;
  const layoutContext = (ctx: ContextNode, style: Style) => {
    if (ctx.nodes.size) {
      const graph = new dagre.graphlib.Graph({
        multigraph: true,
      });
      graph.setGraph({
        nodesep: style.margin,
        edgesep: style.margin,
        ranksep: style.margin,
        acyclicer: ctx.name && "greedy",
        rankdir: "LR",
        ranker: "network-simplex",
      });
      ctx.nodes.forEach((n) => n.color && layouter(n.visual)(n, style));
      ctx.nodes.forEach(
        ({ name, width, height }) =>
          width && height && graph.setNode(name, { width, height })
      );
      ctx.edges.forEach(({ source, target }, name) =>
        graph.setEdge(source.name, target.name, {}, name)
      );
      dagre.layout(graph);

      ctx.nodes.forEach((n) => {
        const gn = graph.node(n.name);
        if (gn) {
          n.x = gn.x;
          n.y = gn.y;
        }
      });

      !ctx.name &&
        graph.edges().forEach((e) => {
          const ge = graph.edge(e);
          const ne = ctx.edges.get(e.name!)!;
          ne.path = [ne.source, ...ge.points!, ne.target].map((n) => ({
            x: Math.floor(n.x!),
            y: Math.floor(n.y!),
          }));
        });
      const { width = 0, height = 0 } = graph.graph();
      ctx.width = width + PAD;
      ctx.height = height + PAD;
    } else {
      ctx.width = splitName(ctx.name).join(" ").length * style.fontSize + PAD;
      ctx.height = style.fontSize + PAD;
    }
  };

  return layoutContext(root, style);
};
