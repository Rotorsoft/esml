import { Artifact } from "./types";

export const Schema: Artifact = {
  grammar: {
    requires: { type: "field", owns: true },
    optional: { type: "field", owns: true },
  },
  rel: () => undefined,
};
