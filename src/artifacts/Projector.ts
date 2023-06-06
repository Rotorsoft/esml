import { Artifact, COLORS } from "./types";

export const Projector: Artifact = {
  grammar: { handles: { type: "event" } },
  rel: (source, target) => ({
    source:
      source.ctx === target.ctx ? target : { ...target, id: target.id + "*" },
    target: source,
    edge: true,
    color: COLORS.event,
    arrow: false,
  }),
};
