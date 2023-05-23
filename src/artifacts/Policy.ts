import { Artifact, COLORS } from "./types";

export const Policy: Artifact = {
  grammar: {
    handles: { visual: "event", owns: false },
    invokes: { visual: "command", owns: false },
    reads: { visual: "projector", owns: false },
  },
  rel: (source, target) =>
    target.visual === "event"
      ? {
          sourceId: target.id + "*",
          targetId: source.id,
          color: COLORS.event,
          dashed: true,
          arrow: false,
        }
      : target.visual === "projector"
      ? { source, target }
      : source.ctx === target.ctx
      ? {
          sourceId: source.id,
          targetId: target.id,
          color: COLORS.command,
          arrow: false,
        }
      : { source: target, target: source },
};
