import { Artifact } from "./types";

export const Actor: Artifact = {
  grammar: {
    invokes: { type: "command" },
    reads: { type: "projector" },
  },
  rel: (source, target) =>
    target.visual === "command"
      ? { source: target, target: source }
      : { source, target },
};
