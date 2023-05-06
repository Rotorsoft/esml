import { rectangle } from "./layout";
import { Artifact, Config, Grammar, Node } from "./types";

export class Projector implements Artifact {
  grammar() {
    return { handles: "event" } as Grammar;
  }
  edge(node: Node, ref: Node) {
    return {
      start: ref.id,
      end: node.id,
      dashed: true,
      arrow: true,
    };
  }
  ref() {
    return undefined;
  }
  layout(node: Node, config: Config) {
    return rectangle(node, config);
  }
}
