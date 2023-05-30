import { ArtType, RelType } from "../artifacts";

export interface Arguments {
  [key: string]: string;
}

export type Art = {
  name: string;
  type: ArtType;
  rels: Array<{ name: string; type: RelType }>;
};
