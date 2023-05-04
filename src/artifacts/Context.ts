import * as graphre from "graphre";
import { Artifact, Config, Grammar, Node } from "./types";
import { EdgeLabel, GraphLabel, GraphNode } from "graphre/decl/types";
import { splitId } from "../utils";
import { square } from "./layout";

export class Context implements Artifact {
  grammar() {
    return { includes: "artifacts" } as Grammar;
  }
  edge(node: Node, message: Node, dashed = false, arrow = true) {
    return { start: node.id, end: message.id, dashed, arrow };
  }
  layout(node: Node, config: Config) {
    if (node.nodes!.size) {
      const g = new graphre.Graph<GraphLabel, GraphNode, EdgeLabel>({
        multigraph: true,
      });
      g.setGraph({
        nodesep: config.spacing,
        edgesep: config.spacing,
        ranksep: config.spacing,
        acyclicer: "greedy",
        rankdir: "LR",
        ranker: "network-simplex",
      });
      node.nodes!.forEach((n) => {
        (n.artifact?.layout || square)(n, config);
        n.width = n.width! + 2 * config.edgeMargin;
        n.height = n.height! + 2 * config.edgeMargin;
      });
      node.nodes!.forEach(({ id, width, height }) =>
        g.setNode(id, { width, height })
      );
      const edges = [...node.edges!.values()].map((edge, index) => {
        g.setEdge(edge.start, edge.end, {}, `${index}`);
        return edge;
      });
      graphre.layout(g);

      node.nodes!.forEach((n) => {
        const gn = g.node(n.id);
        n!.x = gn.x;
        n!.y = gn.y;
      });

      const r = [0, 0, 0, 0];
      for (const e of g.edges()) {
        const ge = g.edge(e);
        const ne = edges[parseInt(e.name!)];
        const start = node.nodes!.get(e.v);
        const end = node.nodes!.get(e.w);
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
      const graph = g.graph();
      const width = Math.max(graph.width!, r[1] - r[0]);
      const height = Math.max(graph.height!, r[3] - r[2]);
      node.width = width + 2 * (config.gutter + config.padding);
      node.height =
        height + config.fontSize + 2 * (config.gutter + config.padding);
      node.offset = { x: config.padding - r[0], y: config.padding - r[2] };
    } else {
      node.width =
        splitId(node.id).join(" ").length * config.fontSize +
        2 * config.padding;
      node.height = config.fontSize + 2 * config.padding;
      node.offset = { x: config.padding, y: config.padding };
    }
  }
}
