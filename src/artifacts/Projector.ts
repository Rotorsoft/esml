import { Artifact, COLORS } from "./types";

export const Projector: Artifact = {
  grammar: { handles: { visual: "event", owns: false } },
  rel: (source, target) => ({
    sourceId: target.id,
    targetId: source.id,
    color: COLORS.event,
    dashed: true,
    arrow: true,
  }),
};
