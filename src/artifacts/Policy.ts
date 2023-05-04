import { rectangle } from "./layout";
import { Artifact, Config, Grammar, Node } from "./types";

export class Policy implements Artifact {
  grammar() {
    return { handles: "event", invokes: "command" } as Grammar;
  }
  edge(node: Node, message: Node) {
    return message.visual === "event"
      ? {
          start: message.id,
          end: node.id,
          dashed: true,
          arrow: true,
        }
      : {
          start: node.id,
          end: message.id,
          dashed: false,
          arrow: true,
        };
  }
  layout(node: Node, config: Config) {
    return rectangle(node, config);
  }
}
