import { Artifact, COLORS } from "./types";

// resolves inter-context relationships
export const Context: Artifact = (source, target, root) => {
  if (target.visual === "event")
    return {
      source: root.nodes.get(target.ctx.id)!,
      target: root.nodes.get(source.ctx.id)!,
      edge: true,
      color: COLORS.event,
      arrow: true,
    };

  if (target.visual === "command")
    return {
      source: root.nodes.get(source.ctx.id)!,
      target: root.nodes.get(target.ctx.id)!,
      edge: true,
      color: COLORS.command,
      arrow: true,
    };

  if (target.visual === "projector")
    return {
      source: root.nodes.get(source.ctx.id)!,
      target: root.nodes.get(target.ctx.id)!,
      edge: true,
      color: COLORS.projector,
      arrow: true,
    };
};
