import { Graphics } from "../graphics/types";
import { Artifact, Config, Grammar, Node } from "./types";

export class Actor implements Artifact {
  private padding = 0;
  grammar() {
    return { invokes: "command" } as Grammar;
  }
  get style() {
    return {
      body: {
        bold: false,
        italic: false,
        center: true,
        color: "#555555",
      },
      fill: "white",
    };
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
    this.padding = config.padding;
  }
  render(node: Node, g: Graphics, x: number, y: number) {
    const a = this.padding / 2;
    const yp = y + a * 4;
    const faceCenter = { x: node.x!, y: yp - a };
    g.circle(faceCenter, a).stroke();
    g.path([
      { x: node.x!, y: yp },
      { x: node.x!, y: yp + 2 * a },
    ]).stroke();
    g.path([
      { x: node.x! - a, y: yp + a },
      { x: node.x! + a, y: yp + a },
    ]).stroke();
    g.path([
      { x: node.x! - a, y: yp + a + this.padding },
      { x: node.x!, y: yp + this.padding },
      { x: node.x! + a, y: yp + a + this.padding },
    ]).stroke();
  }
}
