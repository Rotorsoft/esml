import * as dagre from "dagre";
import { ContextNode, Node, Style, Visual } from "../artifacts";
import { splitId } from "../utils";

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

const half_rectangle: Layouter = (node: Node, style: Style) => {
  node.x = 0;
  node.y = 0;
  node.width = style.scale;
  node.height = style.scale / 2;
};

export const layout = (root: ContextNode, style: Style) => {
  function layouter(visual: Visual): Layouter {
    switch (visual) {
      case "context":
        return layoutContext as Layouter;
      case "actor":
        return half_rectangle;
      case "command":
      case "event":
        return square;
      default:
        return rectangle;
    }
  }

  const layoutContext = (node: ContextNode, style: Style) => {
    if (node.nodes.size) {
      const graph = new dagre.graphlib.Graph({
        multigraph: true,
      });
      graph.setGraph({
        nodesep: style.margin,
        edgesep: style.margin,
        ranksep: style.margin,
        acyclicer: "greedy",
        rankdir: "LR",
        ranker: "network-simplex",
      });
      node.nodes.forEach((n) => layouter(n.visual)(n, style));
      node.nodes.forEach(({ id, width, height }) =>
        graph.setNode(id, { width, height })
      );
      const edges = [...node.edges.values()].map((edge, index) => {
        graph.setEdge(edge.start, edge.end, {}, `${index}`);
        return edge;
      });
      dagre.layout(graph);

      node.nodes.forEach((n) => {
        const gn = graph.node(n.id);
        n!.x = gn.x;
        n!.y = gn.y;
      });

      const r = [0, 0, 0, 0];
      for (const e of graph.edges()) {
        const ge = graph.edge(e);
        const ne = edges[parseInt(e.name!)];
        const start = node.nodes.get(e.v);
        const end = node.nodes.get(e.w);
        ne!.path = [start!, ...ge.points!, end!].map((n) => ({
          x: n.x!,
          y: n.y!,
        }));
        ge.points!.forEach(({ x, y }) => {
          r[0] = r[0] < x ? r[0] : x;
          r[1] = r[1] > x ? r[1] : x;
          r[2] = r[2] < y ? r[2] : y;
          r[3] = r[3] < y ? r[3] : y;
        }); //left,right,top,bottom
      }
      const { width = 0, height = 0 } = graph.graph();
      node.width = Math.max(width, r[1] - r[0]) + 2 * style.padding;
      node.height = Math.max(height, r[3] - r[2]) + 2 * style.padding;
    } else {
      node.width =
        style.padding * 2 + splitId(node.id).join(" ").length * style.fontSize;
      node.height = style.padding * 3 + style.fontSize;
    }
  };

  return layoutContext(root, style);
};
