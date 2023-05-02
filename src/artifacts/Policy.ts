import { Graphics } from "../graphics/types";
import {
  Artifact,
  Config,
  Grammar,
  Node,
  noteRender,
  noteStyle,
  rectangle,
} from "./types";

export class Policy implements Artifact {
  grammar() {
    return { handles: "event", invokes: "command" } as Grammar;
  }
  get style() {
    return noteStyle("policy");
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
  render(node: Node, g: Graphics, x: number, y: number) {
    return noteRender(node, g, x, y);
  }
}
