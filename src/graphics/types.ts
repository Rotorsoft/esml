import { Style, Node } from "../artifacts";
import { Vector } from "../utils";

export type SvgElementType = "g" | "path" | "rect" | "text" | "tspan";
export type SvgAttr = {
  "data-name"?: string;
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
  height?: number;
  width?: number;
  style?: string;
};
export type SvgAttrs = { [K in keyof SvgAttr]?: SvgAttr[K] };

export interface Graphics {
  group(name: string, dx?: number, dy?: number): this;
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
    }
  ): void;
  rect(
    x: number,
    y: number,
    w: number,
    h: number,
    attrs?: {
      fill?: string;
      stroke?: string;
      style?: string;
    }
  ): void;
  path(path: Vector[], attrs?: { dash?: number; close?: boolean }): void;
  serialize(): string;
}

export type Renderable = (node: Node, g: Graphics, style: Style) => void;
