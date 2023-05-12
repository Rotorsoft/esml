import { Vector } from "../utils";
import { Graphics, SvgAttr, SvgAttrs, SvgElementType } from "./types";

function encode(val?: string | number) {
  if ("number" === typeof val) return val.toFixed(0);
  return (val ?? "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function attrs(attrs: SvgAttrs): string {
  return Object.entries(attrs)
    .filter(([_, val]) => val)
    .map(([key, val]) => `${key}="${encode(val)}"`)
    .join(" ");
}

class SvgElement {
  private readonly children: SvgElement[] = [];
  constructor(
    private readonly type: SvgElementType,
    private readonly attrs: SvgAttrs,
    private readonly parent?: SvgElement,
    private readonly text?: string
  ) {}
  get group() {
    return this.parent;
  }
  attr<K extends keyof SvgAttr>(key: K, val: SvgAttrs[K]) {
    this.attrs[key] = val;
    return this;
  }
  append(el: SvgElement) {
    this.children.push(el);
    return this;
  }
  serialize(): string {
    const attr = attrs({ ...this.attrs });
    const body =
      this.children.map((o) => o.serialize()).join("") || encode(this.text);
    return `<${this.type} ${attr}>${body}</${this.type}>`;
  }
}

export class SvgGraphics implements Graphics {
  private readonly root: SvgElement;
  private current: SvgElement;

  private _new(type: SvgElementType, attr: SvgAttrs, text?: string) {
    this.current.append(new SvgElement(type, attr, this.current, text));
  }

  constructor(attrs: SvgAttrs) {
    this.root = this.current = new SvgElement("g", {
      ...attrs,
      "data-name": "root",
    });
  }

  group(name: string, dx = 0, dy = 0) {
    const element = new SvgElement("g", {}, this.current);
    this.current.append(element);
    this.current = element;
    name && this.attr("data-name", name);
    (dx || dy) && this.attr("transform", `translate(${dx}, ${dy})`);
    return this;
  }
  ungroup() {
    this.current.group && (this.current = this.current.group);
  }
  attr<K extends keyof SvgAttr>(key: K, val: SvgAttrs[K]) {
    this.current.attr(key, val);
    return this;
  }
  rect(
    x: number,
    y: number,
    width: number,
    height: number,
    attrs?: {
      fill?: string;
      stroke?: string;
      style?: string;
    }
  ) {
    this._new("rect", { x, y, height, width, ...attrs });
  }
  path(path: Vector[], attrs?: { dash?: number; close: boolean }) {
    const d = path
      .map((e, i) => (i ? "L" : "M") + e.x.toFixed(0) + " " + e.y.toFixed(0))
      .join(" ");
    const _attrs: SvgAttrs = { d };
    if (attrs) {
      attrs.dash &&
        (_attrs["stroke-dasharray"] = `${attrs.dash} ${attrs.dash}`);
      attrs.close && (_attrs.d = d.concat(" Z"));
    }
    this._new("path", _attrs);
  }
  text(
    text: string,
    x: number,
    y: number,
    attrs?: {
      fill?: string;
      stroke?: string;
      dy?: number | string;
    }
  ) {
    this._new("text", { x, y, ...attrs }, text);
  }
  serialize() {
    return this.root.serialize();
  }
}
