import { Actor } from "./Actor";
import { Aggregate } from "./Aggregate";
import { Context } from "./Context";
import { Policy } from "./Policy";
import { Process } from "./Process";
import { Projector } from "./Projector";
import { System } from "./System";
import { Artifacts } from "./types";

export const artifacts: Artifacts = {
  actor: new Actor(),
  aggregate: new Aggregate(),
  context: new Context(),
  policy: new Policy(),
  process: new Process(),
  projector: new Projector(),
  system: new System(),
};
export * from "./types";
