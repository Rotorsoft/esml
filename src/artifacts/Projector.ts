import { Artifact, Grammar, Node } from "./types";

export class Projector implements Artifact {
  grammar() {
    return { handles: { visual: "event", owns: false } } as Grammar;
  }
  edge(node: Node, ref: Node) {
    return {
      start: ref.id,
      end: node.id,
      dashed: true,
      arrow: true,
    };
  }
  ref() {
    return undefined;
  }
}
