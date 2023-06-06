import { Actor } from "./Actor";
import { Context } from "./Context";
import { Policy } from "./Policy";
import { Projector } from "./Projector";
import { Schema } from "./Schema";

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
  schema: Schema,
};
export * from "./types";
