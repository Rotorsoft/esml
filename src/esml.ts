import json5 from "json5";
import { ZodError } from "zod";
import { ContextNode, Field, Style, Visual } from "./artifacts";
import { compile } from "./compiler";
import { layout, render } from "./graphics";
import { Grammar } from "./schema";

export class Json5Error extends Error {
  constructor(
    readonly message: string,
    readonly source: {
      from: { line: number; col: number };
      to: { line: number; col: number };
    }
  ) {
    super(message);
  }
}

type Font = "monospace" | "inconsolata" | "caveat" | "handlee";
const FONTS: { [key in Font]: string } = {
  monospace: "Monospace",
  inconsolata: "Inconsolata",
  caveat: "Caveat",
  handlee: "Handlee",
};
const DEFAULT_FONT = "inconsolata";

export type Node = {
  id: string;
  visual: Visual;
  ctx: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fields: Field[];
  description?: string;
};

export const esml = (
  code: string,
  scale: number,
  font = DEFAULT_FONT
): {
  error?: Error;
  svg?: string;
  width?: number;
  height?: number;
  nodes?: Node[];
} => {
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
    const model = Grammar.parse(json5.parse(code));
    const root = compile(model);
    layout(root, style);
    const svg = render(root, style);
    const nodes = [...root.nodes.values()]
      .filter((n) => n.id !== "actors")
      .flatMap((n) => [...(n as ContextNode).nodes.values()]);
    return {
      svg,
      width: root.width,
      height: root.height,
      nodes: nodes.map(
        ({ id, visual, ctx, x, y, width, height, description }) => {
          const schema = ctx.schemas.get(id);
          return {
            id,
            visual,
            ctx: ctx.id,
            x,
            y,
            width,
            height,
            fields: schema ? [...schema.values()] : [],
            description: description ?? schema?.description,
          } as Node;
        }
      ),
    };
  } catch (error: any) {
    if ("lineNumber" in error && "columnNumber" in error)
      return {
        error: new Json5Error(error.message, {
          from: { line: error.lineNumber - 1, col: 0 },
          to: { line: error.lineNumber - 1, col: error.columnNumber },
        }),
      };
    if (error instanceof ZodError)
      return {
        error: Error(
          error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("\n")
        ),
      };
    if (error instanceof Error) {
      const message = error.stack!.split("\n").slice(0, 2).join(" ");
      return { error: Error(message) };
    }
    return { error: Error(error) };
  }
};
