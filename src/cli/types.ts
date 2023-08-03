import { Node, Schema, Visual } from "../artifacts";

export interface Arguments {
  [key: string]: string;
}

export type Art = {
  name: string;
  type: Visual;
  schema?: Schema;
  in: Array<Node & { schema?: Schema }>;
  out: Array<Node & { schema?: Schema }>;
};
