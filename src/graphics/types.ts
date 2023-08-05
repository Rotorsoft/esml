import type { Style, Node } from "../types";

export type SvgElementType = "g" | "path" | "rect" | "text" | "tspan";

export type SvgAttr = {
  id?: string;
  "data-name"?: string;
  class?: string;
  transform?: string;
  fill?: string;
  stroke?: string;
  "stroke-width"?: number;
  "stroke-dasharray"?: string;
  "font-family"?: string;
  "font-size"?: number | string;
  "font-weight"?: "bold" | "normal";
  "font-style"?: "italic" | "normal";
  "text-align"?: "left" | "center" | "right";
  "text-anchor"?: "start" | "middle" | "end";
  d?: string;
  x?: number;
  y?: number;
  dx?: number | string;
  dy?: number | string;
  rx?: number;
  ry?: number;
  height?: number;
  width?: number;
  style?: string;
};

export type Path = { x?: number; y?: number; dx?: number; dy?: number };

export type SvgAttrs = { [K in keyof SvgAttr]?: SvgAttr[K] };

export interface Graphics {
  group(
    id: string,
    name: string,
    attrs?: { class?: string; dx?: number; dy?: number }
  ): this;
  ungroup(): void;
  attr<K extends keyof SvgAttr>(key: K, val: SvgAttrs[K]): this;
  text(
    text: string,
    x: number,
    y: number,
    attrs?: {
      fill?: string;
      stroke?: string;
      dy?: number | string;
      "font-family"?: string;
      "font-size"?: number | string;
    }
  ): void;
  rect(
    x: number,
    y: number,
    width: number,
    height: number,
    attrs?: {
      fill?: string;
      stroke?: string;
      style?: string;
      rx?: number;
      ry?: number;
    }
  ): void;
  path(path: Path[], close?: boolean, attrs?: SvgAttrs): void;
  serialize(): string;
}

export type Renderable = (node: Node, g: Graphics, style: Style) => void;
