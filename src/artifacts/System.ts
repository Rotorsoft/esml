import { Artifact } from "./types";

export const System: Artifact = {
  grammar: {
    handles: { visual: "command", owns: true },
    emits: { visual: "event", owns: true },
  },
  rel: (source, target) =>
    target.visual === "command"
      ? { source: target, target: source, edge: true }
      : { source, target, edge: true },
};
