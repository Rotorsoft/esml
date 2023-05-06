import { rectangle } from "./layout";
import { Artifact, Config, Grammar, Node } from "./types";

export class System implements Artifact {
  grammar() {
    return { handles: "command", emits: "event" } as Grammar;
  }
  edge(node: Node, ref: Node) {
    return ref.visual === "command"
      ? {
          start: ref.id,
          end: node.id,
          dashed: false,
          arrow: true,
        }
      : {
          start: node.id,
          end: ref.id,
          dashed: false,
          arrow: false,
        };
  }
  ref() {
    return undefined;
  }
  layout(node: Node, config: Config) {
    return rectangle(node, config);
  }
}
