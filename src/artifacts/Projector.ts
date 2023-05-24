import { Artifact, COLORS } from "./types";

export const Projector: Artifact = {
  grammar: { handles: { visual: "event", owns: false } },
  rel: (source, target) => ({
    source: target,
    target: source,
    edge: true,
    color: COLORS.event,
    arrow: false,
  }),
};
