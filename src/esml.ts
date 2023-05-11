import { Config, Font } from "./artifacts";
import { CompilerError, compile } from "./compiler";
import { layout, render } from "./graphics";
import { ParseError, parse } from "./parser";

const FONTS: Record<string, Font> = {
  monospace: { family: "Monospace", heightScale: 0.3 },
  inconsolata: { family: "Inconsolata", heightScale: 0.3 },
  caveat: { family: "Caveat", heightScale: 0.25 },
  handlee: { family: "Handlee", heightScale: 0.3 },
};
const DEFAULT_FONT = "inconsolata";

export const esml = (
  code: string,
  scale: number,
  font = DEFAULT_FONT
): { error?: Error; svg?: string; width?: number; height?: number } => {
  const config: Config = {
    arrowSize: 0.5,
    gravity: Math.round(+1),
    background: "#f8f9fa",
    font: FONTS[font.toLowerCase()] || FONTS[DEFAULT_FONT],
    fontSize: 12,
    leading: 1.25,
    lineWidth: 1,
    padding: 12,
    spacing: 40,
    stroke: "#DDDDDD",
    scale,
  };

  try {
    const statements = parse(code);
    // console.log(
    //   [...statements.entries()].map(
    //     ([id, s]) =>
    //       `[${pad(s.source.from.line, 3)}:${pad(s.source.from.col, 3)} - ${pad(
    //         s.source.to.line,
    //         3
    //       )}:${pad(s.source.to.col, 3)}] ${s.type} ${id} ${s.rels.size} rels`
    //   )
    // );
    const root = compile(statements);
    layout(root, config);
    const svg = render(root, config);
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
