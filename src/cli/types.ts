import type { Node } from "../types";

export interface Arguments {
  [key: string]: string;
}

export type Art = Node & {
  in: Array<Node>;
  out: Array<Node>;
};
