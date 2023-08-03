import { Artifact } from "./types";

export const System: Artifact = (source, target) =>
  target.visual === "command"
    ? { source: target, target: source, edge: true }
    : { source, target, edge: true };
