import { Graphics, Path, SvgAttr, SvgAttrs, SvgElementType } from "./types";

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
    private parent?: SvgElement,
    private text?: string
  ) {}
  get group() {
    return this.parent;
  }
  attr<K extends keyof SvgAttr>(key: K, val: SvgAttrs[K]) {
    this.attrs[key] = val;
    return this;
  }
  append(el: SvgElement) {
    el.parent = this;
    this.children.push(el);
    return el;
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

  group(name: string, attrs?: { class?: string; dx?: number; dy?: number }) {
    const element = new SvgElement("g", {}, this.current);
    this.current.append(element);
    this.current = element;
    if (name) {
      this.attr("id", "g-" + name);
      this.attr("data-name", name);
    }
    if (attrs) {
      attrs.class && this.attr("class", attrs.class);
      (attrs.dx || attrs.dy) &&
        this.attr("transform", `translate(${attrs.dx}, ${attrs.dy})`);
    }
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
      rx?: number;
      ry?: number;
    }
  ) {
    this._new("rect", { x, y, height, width, ...attrs });
  }
  path(path: Path[], close?: boolean, attrs?: SvgAttrs) {
    const d = path
      .map((p, i) =>
        p.x && p.y
          ? (i ? "L" : "M") + p.x.toFixed(0) + " " + p.y.toFixed(0)
          : p.dx
          ? "h" + p.dx.toFixed(0)
          : p.dy
          ? "v" + p.dy.toFixed(0)
          : ""
      )
      .join(" ")
      .concat(close ? " Z" : "");
    this._new("path", { ...attrs, d });
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
