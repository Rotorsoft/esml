import { Visual } from "../artifacts";

export interface Arguments {
  [key: string]: string;
}

export type Art = {
  name: string;
  type: Visual;
  inputs: string[];
  outputs: string[];
};
