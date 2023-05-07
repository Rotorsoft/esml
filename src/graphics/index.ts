import { Config, ContextNode } from "../artifacts";
import { layout } from "./layout";
import { render } from "./render";
import { svg } from "./svg";

export { Graphics } from "./types";

export const renderSvg = (root: ContextNode, config: Config): string => {
  const g = svg();
  layout(root, config);
  render(root, g, config);
  return g.serialize();
};
