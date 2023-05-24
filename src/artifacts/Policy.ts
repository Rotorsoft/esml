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
          source: { ...target, id: target.id + "*" }, // copy target event into context
          target: source,
          edge: true,
          color: COLORS.event,
          arrow: false,
        }
      : target.visual === "projector"
      ? { source, target }
      : source.ctx === target.ctx
      ? {
          source,
          target,
          edge: true,
          color: COLORS.command,
          arrow: false,
        }
      : { source: target, target: source },
};
