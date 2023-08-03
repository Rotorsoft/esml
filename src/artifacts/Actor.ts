import { Artifact } from "./types";

export const Actor: Artifact = (source, target) =>
  target.visual === "command"
    ? { source: target, target: source }
    : { source, target };
