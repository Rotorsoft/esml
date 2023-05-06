import { Artifact, Config, Grammar, Node } from "./types";

export class Actor implements Artifact {
  grammar() {
    return { invokes: "command" } as Grammar;
  }
  edge(node: Node, ref: Node) {
    return {
      start: node.id,
      end: ref.id,
      dashed: false,
      arrow: true,
    };
  }
  ref() {
    return undefined;
  }
  layout(node: Node, config: Config) {
    node.x = 0;
    node.y = 0;
    node.width = config.scale / 2;
    node.height = config.scale / 2;
  }
}
