import { Config, Node, artifacts } from "../artifacts";
import { renderRoot } from "./render";
import { svg } from "./svg";

export { Graphics } from "./types";

export const renderSvg = (root: Node, config: Config): string => {
  const g = svg();
  artifacts.context.layout(root, config);
  renderRoot(root, g, config);
  return g.serialize();
};
