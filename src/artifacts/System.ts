import { Artifact } from "./types";

export const System: Artifact = {
  grammar: {
    handles: { type: "command", owns: true },
    emits: { type: "event", owns: true },
  },
  rel: (source, target) =>
    target.visual === "command"
      ? { source: target, target: source, edge: true }
      : { source, target, edge: true },
};
