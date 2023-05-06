import { Config, Node } from "./types";

export const square = (node: Node, config: Config) => {
  node.x = 0;
  node.y = 0;
  node.width = config.scale;
  node.height = config.scale;
};

export const rectangle = (node: Node, config: Config) => {
  node.x = 0;
  node.y = 0;
  node.width = config.scale * 2;
  node.height = config.scale;
};
