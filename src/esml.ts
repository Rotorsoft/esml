import { renderSvg } from "./graphics";
import { ParseError, parse } from "./parser";

export const esml = (
  code: string,
  scale: number
): { error?: ParseError; svg?: string; width?: number; height?: number } => {
  const config = {
    arrowSize: 0.5,
    gutter: 20,
    edgeMargin: 0,
    gravity: Math.round(+1),
    background: "#f8f9fa",
    font: "Handlee,Caveat,Inconsolata,Monospace",
    fontSize: scale / 10,
    leading: 1.25,
    lineWidth: 1,
    padding: 8,
    spacing: 40,
    stroke: "#CCCCCC",
    scale,
  };

  try {
    const root = parse(code);
    return renderSvg(root, config);
  } catch (error: any) {
    return { error };
  }
};
