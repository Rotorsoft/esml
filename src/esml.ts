import { Style } from "./artifacts";
import { CompilerError, compile } from "./compiler";
import { layout, render } from "./graphics";
import { ParseError, parse } from "./parser";

type Font = "monospace" | "inconsolata" | "caveat" | "handlee";
const FONTS: { [key in Font]: string } = {
  monospace: "Monospace",
  inconsolata: "Inconsolata",
  caveat: "Caveat",
  handlee: "Handlee",
};
const DEFAULT_FONT = "inconsolata";

export const esml = (
  code: string,
  scale: number,
  font = DEFAULT_FONT
): { error?: Error; svg?: string; width?: number; height?: number } => {
  const style: Style = {
    scale,
    stroke: "#dedede",
    fill: "white",
    font: FONTS[font.toLowerCase() as Font] || FONTS[DEFAULT_FONT],
    fontSize: 12,
    padding: 30,
    margin: 40,
  };

  try {
    const statements = parse(code);
    const root = compile(statements);
    layout(root, style);
    const svg = render(root, style);
    return { svg, width: root.width, height: root.height };
  } catch (error: any) {
    if (error instanceof ParseError) return { error };
    if (error instanceof CompilerError) return { error };
    if (error instanceof Error) {
      const message = error.stack!.split("\n").slice(0, 2).join(" ");
      return { error: Error(message) };
    }
    return { error: Error(error) };
  }
};
