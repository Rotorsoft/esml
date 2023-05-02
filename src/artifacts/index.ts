import { Actor } from "./Actor";
import { Aggregate } from "./Aggregate";
import { Context } from "./Context";
import { Policy } from "./Policy";
import { Process } from "./Process";
import { Projector } from "./Projector";
import { System } from "./System";
import {
  Artifact,
  Renderable,
  Type,
  Visual,
  noteRender,
  noteStyle,
  square,
} from "./types";

export * from "./types";

type Artifacts = { [key in Type]: Artifact };
export const artifacts: Artifacts = {
  context: new Context(),
  actor: new Actor(),
  aggregate: new Aggregate(),
  system: new System(),
  policy: new Policy(),
  process: new Process(),
  projector: new Projector(),
};

export const visual = (visual: Visual): Renderable => {
  const artifact = artifacts[visual as Type];
  return artifact
    ? artifact
    : ({
        style: noteStyle(visual),
        layout: square,
        render: noteRender,
      } as Renderable);
};
