import { Config, Node } from "./types";

export const square = (node: Node, config: Config) => {
  node.x = 0;
  node.y = 0;
  node.width = config.scale;
  node.height = config.scale;
  node.offset = { x: 8, y: 8 };
};

export const rectangle = (node: Node, config: Config) => {
  node.x = 0;
  node.y = 0;
  node.width = config.scale * 2;
  node.height = config.scale;
  node.offset = { x: 8, y: 8 };
};
