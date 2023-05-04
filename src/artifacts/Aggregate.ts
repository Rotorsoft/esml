import { rectangle } from "./layout";
import { Artifact, Config, Grammar, Node } from "./types";

export class Aggregate implements Artifact {
  grammar() {
    return { handles: "command", emits: "event" } as Grammar;
  }
  edge(node: Node, message: Node) {
    return message.visual === "command"
      ? {
          start: message.id,
          end: node.id,
          dashed: false,
          arrow: true,
        }
      : {
          start: node.id,
          end: message.id,
          dashed: false,
          arrow: false,
        };
  }
  layout(node: Node, config: Config) {
    return rectangle(node, config);
  }
}
