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

export class Aggregate implements Artifact {
  grammar() {
    return { handles: "command", emits: "event" } as Grammar;
  }
  get style() {
    return noteStyle("aggregate");
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
  render(node: Node, g: Graphics, x: number, y: number) {
    return noteRender(node, g, x, y);
  }
}
