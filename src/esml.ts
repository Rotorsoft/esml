import { Config } from "./artifacts";
import { renderSvg } from "./graphics";
import { ParseError, parse } from "./parser";

export const esml = (
  code: string,
  scale: number
): { error?: ParseError; svg?: string } => {
  const config: Config = {
    arrowSize: 0.5,
    gravity: Math.round(+1),
    background: "#f8f9fa",
    //font: { family: "Monospace", widthScale: 1.5 },
    //font: { family: "Inconsolata", widthScale: 1.8 },
    //font: { family: "Caveat", widthScale: 2.1 },
    font: { family: "Handlee", widthScale: 1.7, heightScale: 0.4 },
    fontSize: 12,
    leading: 1.25,
    lineWidth: 1,
    padding: 12,
    spacing: 40,
    stroke: "#DDDDDD",
    scale,
  };

  try {
    const root = parse(code);
    return { svg: renderSvg(root, config) };
  } catch (error: any) {
    return { error };
  }
};
