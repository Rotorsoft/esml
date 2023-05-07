import { Artifact, Grammar, Node } from "./types";

export class Actor implements Artifact {
  grammar() {
    return { invokes: { visual: "command", owns: true } } as Grammar;
  }
  edge(node: Node, ref: Node) {
    return {
      start: node.id,
      end: ref.id,
      dashed: false,
      arrow: true,
    };
  }
  ref() {
    return undefined;
  }
}
