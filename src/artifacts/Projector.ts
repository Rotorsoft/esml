import { rectangle } from "./layout";
import { Artifact, Config, Grammar, Node } from "./types";

export class Projector implements Artifact {
  grammar() {
    return { handles: "event" } as Grammar;
  }
  edge(node: Node, message: Node) {
    return {
      start: message.id,
      end: node.id,
      dashed: true,
      arrow: true,
    };
  }
  layout(node: Node, config: Config) {
    return rectangle(node, config);
  }
}
