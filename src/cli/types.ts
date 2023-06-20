import { Node, Schema, Visual } from "../artifacts";

export interface Arguments {
  [key: string]: string;
}

export type Art = {
  name: string;
  type: Visual;
  schema?: Schema;
  in: Node[];
  out: Node[];
};
