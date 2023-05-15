import { Artifact } from "./types";

export const Actor: Artifact = {
  grammar: {
    invokes: { visual: "command", owns: false },
    reads: { visual: "projector", owns: false },
  },
  rel: (source, target) =>
    target.visual === "command"
      ? {
          // sourceId: source.id,
          // targetId: target.id,
          // color: COLORS.command,
          // arrow: true,

          sourceId: target.id,
          target: source,
        }
      : { sourceId: source.id, target },
};
