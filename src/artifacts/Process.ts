import { Artifact, Grammar, Node } from "./types";

export class Process implements Artifact {
  grammar() {
    return {
      handles: { visual: "event", owns: false },
      invokes: { visual: "command", owns: false },
      reads: { visual: "projector", owns: false },
    } as Grammar;
  }
  edge(node: Node, ref: Node) {
    if (ref.visual === "event")
      return {
        start: ref.id,
        end: node.id,
        render: true,
        dashed: true,
        arrow: true,
      };
  }
  ref(node: Node, ref: Node) {
    if (ref.visual === "command") return { hostId: ref.id, target: node };
    if (ref.visual === "projector") return { hostId: node.id, target: ref };
  }
}
