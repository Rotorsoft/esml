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

export class Projector implements Artifact {
  grammar() {
    return { handles: "event" } as Grammar;
  }
  get style() {
    return noteStyle("projector");
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
  render(node: Node, g: Graphics, x: number, y: number) {
    return noteRender(node, g, x, y);
  }
}
