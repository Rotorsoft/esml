import { Config } from "./artifacts";
import { CompilerError, compile } from "./compiler";
import { renderSvg } from "./graphics";
import { ParseError, parse } from "./parser";

export const esml = (
  code: string,
  scale: number
): { error?: Error; svg?: string } => {
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

    return { svg: renderSvg(root, config) };
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
