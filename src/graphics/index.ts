import { Config, Node, artifacts } from "../artifacts";
import { render } from "./render";
import { svg } from "./svg";

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
  render(root, g, config);
  return {
    svg: g.serialize(),
    width: root.width!,
    height: root.height!,
  };
};
