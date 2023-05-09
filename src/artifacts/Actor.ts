import { Artifact, Grammar, Node } from "./types";

export class Actor implements Artifact {
  grammar() {
    return {
      invokes: { visual: "command", owns: true },
      reads: { visual: "projector", owns: false },
    } as Grammar;
  }
  edge(node: Node, ref: Node) {
    if (ref.visual === "command")
      return {
        start: node.id,
        end: ref.id,
        dashed: false,
        arrow: true,
      };
  }
  ref(node: Node, ref: Node) {
    if (ref.visual === "projector") return { hostId: node.id, target: ref };
  }
}
