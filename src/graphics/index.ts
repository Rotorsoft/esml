import { Config, Node, artifacts } from "../artifacts";
import { renderRoot } from "./render";
import { svg } from "./svg";

export { Graphics } from "./types";

export const renderSvg = (
  root: Node,
  config: Config
): {
  svg: string;
  width: number;
  height: number;
} => {
  const g = svg();
  artifacts.context.layout(root, config);
  renderRoot(root, g, config);
  return {
    svg: g.serialize(),
    width: root.width!,
    height: root.height!,
  };
};
