import { Artifact, COLORS } from "./types";

export const Context: Artifact = {
  grammar: {
    includes: { visual: "artifact", owns: true },
  },
  // resolves inter-context relationships
  rel: (source, target, root) => {
    if (target.visual === "event")
      return {
        source: root.nodes.get(target.ctx!)!,
        target: root.nodes.get(source.ctx!)!,
        edge: true,
        color: COLORS.event,
        arrow: true,
      };

    if (target.visual === "command")
      return {
        source: root.nodes.get(source.ctx!)!,
        target: root.nodes.get(target.ctx!)!,
        edge: true,
        color: COLORS.command,
        arrow: true,
      };

    if (target.visual === "projector")
      return {
        source: root.nodes.get(source.ctx!)!,
        target: root.nodes.get(target.ctx!)!,
        edge: true,
        color: COLORS.projector,
        arrow: true,
      };
  },
};
