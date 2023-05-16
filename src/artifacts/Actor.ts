import { Artifact } from "./types";

export const Actor: Artifact = {
  grammar: {
    invokes: { visual: "command", owns: false },
    reads: { visual: "projector", owns: false },
  },
  rel: (source, target) =>
    target.visual === "command"
      ? { source: target, target: source }
      : { source, target },
};
