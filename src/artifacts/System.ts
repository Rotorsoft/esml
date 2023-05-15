import { Artifact } from "./types";

export const System: Artifact = {
  grammar: {
    handles: { visual: "command", owns: true },
    emits: { visual: "event", owns: true },
  },
  rel: (source, target) =>
    target.visual === "command"
      ? {
          sourceId: target.id,
          targetId: source.id,
        }
      : {
          sourceId: source.id,
          targetId: target.id,
        },
};
