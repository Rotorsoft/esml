import { rectangle } from "./layout";
import { Artifact, Config, Grammar, Node } from "./types";

export class Policy implements Artifact {
  grammar() {
    return {
      handles: "event",
      invokes: "command",
      reads: "projector",
    } as Grammar;
  }
  edge(node: Node, ref: Node) {
    if (ref.visual === "event")
      return {
        start: ref.id,
        end: node.id,
        dashed: true,
        arrow: true,
      };
  }
  ref(node: Node, ref: Node) {
    if (ref.visual === "command") return { host: ref, target: node };
    if (ref.visual === "projector") return { host: node, target: ref };
  }
  layout(node: Node, config: Config) {
    return rectangle(node, config);
  }
}
