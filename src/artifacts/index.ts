import { Actor } from "./Actor";
import { Context } from "./Context";
import { Policy } from "./Policy";
import { Projector } from "./Projector";
import { System } from "./System";
import { ArtType, Artifact } from "./types";

export const artifacts: { [key in ArtType]: Artifact } = {
  context: Context,
  actor: Actor,
  aggregate: System,
  system: System,
  policy: Policy,
  process: Policy,
  projector: Projector,
};
export * from "./types";
