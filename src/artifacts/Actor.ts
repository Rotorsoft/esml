import { Artifact, Config, Grammar, Node } from "./types";

export class Actor implements Artifact {
  grammar() {
    return { invokes: "command" } as Grammar;
  }
  edge(node: Node, message: Node) {
    return {
      start: node.id,
      end: message.id,
      dashed: false,
      arrow: true,
    };
  }
  layout(node: Node, config: Config) {
    node.x = 0;
    node.y = 0;
    node.width = config.scale / 2;
    node.height = config.scale / 2;
    node.offset = { x: 8, y: config.scale / 3 };
  }
}
