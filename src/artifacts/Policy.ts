import { Artifact, COLORS } from "./types";

export const Policy: Artifact = (source, target) =>
  target.visual === "event"
    ? {
        source:
          source.ctx === target.ctx
            ? target
            : { ...target, id: target.id + "*" },
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
    : { source: target, target: source };
