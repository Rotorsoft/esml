import { Artifact, Grammar, Node } from "./types";

export class Aggregate implements Artifact {
  grammar() {
    return {
      handles: { visual: "command", owns: true },
      emits: { visual: "event", owns: true },
    } as Grammar;
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
}
