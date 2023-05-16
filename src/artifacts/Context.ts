import { Artifact, COLORS } from "./types";

export const Context: Artifact = {
  grammar: {
    includes: { visual: "artifact", owns: true },
  },
  // resolves inter-context relationships
  rel: (source, target) => {
    if (target.visual === "event")
      return {
        sourceId: target.ctx!,
        targetId: source.ctx!,
        color: COLORS.event,
        dashed: true,
        arrow: true,
      };

    if (target.visual === "command")
      return {
        sourceId: source.ctx!,
        targetId: target.ctx!,
        color: COLORS.command,
        arrow: true,
      };

    if (target.visual === "projector")
      return {
        sourceId: source.ctx!,
        targetId: target.ctx!,
        color: COLORS.projector,
        arrow: true,
      };
  },
};
