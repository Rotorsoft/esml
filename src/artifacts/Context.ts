import { Artifact, Grammar, Node } from "./types";

export class Context implements Artifact {
  grammar() {
    return { includes: { visual: "artifact", owns: true } } as Grammar;
  }
  edge(node: Node, ref: Node, dashed = false, arrow = true) {
    return { start: node.id, end: ref.id, dashed, arrow };
  }
  ref() {
    return undefined;
  }
}
