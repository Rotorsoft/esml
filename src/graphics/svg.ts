import { Vector, add, range } from "../utils";
import { Graphics } from "./types";

interface SvgAttr {
  transform?: string;
  stroke?: string;
  "stroke-width"?: number;
  "stroke-dasharray"?: string;
  "stroke-linejoin"?: string;
  "stroke-linecap"?: string;
  fill?: string;
  "text-align"?: string;
  font?: string;
  "font-size"?: string;
  "font-weight"?: "bold" | "normal";
  "font-family"?: string;
  "font-style"?: "italic" | "normal";
}

function toAttrString(
  obj: Record<string, undefined | string | number>
): string {
  return Object.entries(obj)
    .filter(([_, val]) => val !== undefined)
    .map(([key, val]) => `${key}="${xmlEncode(val)}"`)
    .join(" ");
}

function xmlEncode(str: string | undefined | number) {
  if ("number" === typeof str) return str.toFixed(1);
  return (str ?? "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function svg(): Graphics {
  const initialState: SvgAttr = { "stroke-width": 1 };
  type SvgElement =
    | "svg"
    | "g"
    | "path"
    | "ellipse"
    | "circle"
    | "rect"
    | "text"
    | "desc"
    | "title"
    | "tspan";
  class Element {
    constructor(
      name: SvgElement,
      attr: Record<string, string | number>,
      parent: GroupElement | undefined,
      text?: string
    ) {
      this.name = name;
      this.attr = attr;
      this.parent = parent;
      this.children = [];
      this.text = text || undefined;
    }
    name: string;
    attr: any;
    parent: GroupElement | undefined;
    children: Element[];
    text: string | undefined;
    elideEmpty = false;

    group() {
      return this.parent;
    }

    stroke() {
      this.attr.fill = "none";
      return this;
    }

    fill() {
      this.attr.stroke = "none";
      return this;
    }
    fillAndStroke() {
      return this;
    }

    serialize(): string {
      const data = getDefined(this.group(), (e) => e.data) ?? {};
      const attrs = toAttrString({ ...this.attr, ...data });
      const content = this.children.map((o) => o.serialize()).join("");
      if (this.name === "svg") return content;
      else if (this.text && this.children.length === 0)
        return `<${this.name} ${attrs}>${xmlEncode(this.text)}</${this.name}>`;
      else if (this.children.length === 0)
        return this.elideEmpty ? "" : `<${this.name} ${attrs}></${this.name}>`;
      else return `<${this.name} ${attrs}>${content}</${this.name}>`;
    }
  }

  function getDefined<T>(
    group: GroupElement | undefined,
    getter: (e: GroupElement) => T | undefined
  ): T | undefined {
    if (!group) return getter(syntheticRoot);
    return (
      getter(group) ??
      getDefined<T>(group.parent, getter) ??
      getter(syntheticRoot)
    );
  }

  class GroupElement extends Element {
    attr: SvgAttr = {};
    data: Record<string, string> = {};

    constructor(parent: GroupElement, dx = 0, dy = 0) {
      super("g", {}, parent);
      this.attr.transform = `translate(${dx}, ${dy})`;
    }
    elideEmpty = true;
    group() {
      return this;
    }
  }

  const syntheticRoot = new GroupElement({} as GroupElement);
  syntheticRoot.attr = initialState;

  var root: Element = new Element(
    "svg",
    {
      version: "1.1",
      baseProfile: "full",
      xmlns: "http://www.w3.org/2000/svg",
      "xmlns:xlink": "http://www.w3.org/1999/xlink",
      "xmlns:ev": "http://www.w3.org/2001/xml-events",
    },
    undefined
  );
  var current: GroupElement = new GroupElement(root as GroupElement);
  current.attr = initialState;
  root.children.push(current);
  var inPathBuilderMode = false;

  function tracePath(
    path: Vector[],
    offset: Vector = { x: 0, y: 0 },
    s: number = 1
  ): Element {
    var d = path
      .map(
        (e, i) =>
          (i ? "L" : "M") +
          (offset.x + s * e.x).toFixed(1) +
          " " +
          (offset.y + s * e.y).toFixed(1)
      )
      .join(" ");
    return el("path", { d: d });
  }

  function el(
    type: SvgElement,
    attr: Record<string, string | number>,
    text?: string
  ) {
    var element = new Element(type, attr, current, text);
    current.children.push(element);
    return element;
  }

  return {
    group: function (dx: number, dy: number) {
      const node = new GroupElement(current, dx, dy);
      current.children.push(node);
      current = node;
    },
    ungroup: function () {
      if (current.parent) current = current.parent;
    },
    circle: function (p: Vector, r: number) {
      return el("circle", { r: r, cx: p.x, cy: p.y });
    },
    ellipse: function (center, w, h, start = 0, stop = 0) {
      if (start || stop) {
        var path = range([start, stop], 64).map((a) =>
          add(center, { x: (Math.cos(a) * w) / 2, y: (Math.sin(a) * h) / 2 })
        );
        return tracePath(path);
      } else {
        return el("ellipse", {
          cx: center.x,
          cy: center.y,
          rx: w / 2,
          ry: h / 2,
        });
      }
    },
    arc: function (cx, cy, r /*, start, stop*/) {
      return el("ellipse", { cx, cy, rx: r, ry: r });
    },
    roundRect: function (x, y, width, height, r) {
      return el("rect", { x, y, rx: r, ry: r, height, width });
    },
    rect: function (x, y, width, height, style?: string) {
      return el("rect", { x, y, height, width, style: style || "" });
    },
    path: tracePath,
    circuit: function (path, offset, s) {
      var element = tracePath(path, offset, s);
      element.attr.d += " Z";
      return element;
    },
    setFontFamily: function (family: string): void {
      current.attr!["font-family"] = family;
    },
    setFont: function (
      size: number,
      weight?: "bold" | "normal",
      style?: "italic" | "normal"
    ): void {
      current.attr!["font-size"] = size + "px";
      weight && (current.attr!["font-weight"] = weight);
      style && (current.attr!["font-style"] = style);
    },
    strokeStyle: function (stroke) {
      current.attr!.stroke = stroke;
    },
    fillStyle: function (fill) {
      current.attr!.fill = fill;
    },
    arcTo: function (x1, y1, x2, y2) {
      if (inPathBuilderMode)
        current.children.at(-1)!.attr.d +=
          "L" + x1 + " " + y1 + " L" + x2 + " " + y2 + " ";
      else throw new Error("can only be called after .beginPath()");
    },
    beginPath: function () {
      inPathBuilderMode = true;
      return el("path", { d: "" });
    },
    fillText: function (text, x, y, fill, dy) {
      const attr = { x, y, fill, stroke: fill } as Record<
        string,
        string | number
      >;
      const anchor =
        getDefined(current, (e) => e.attr!["text-align"]) === "center";
      anchor && (attr["text-anchor"] = "middle");
      dy && (attr["dy"] = dy);
      return el("text", attr, text);
    },
    lineTo: function (x, y) {
      if (inPathBuilderMode)
        current.children.at(-1)!.attr.d +=
          "L" + x.toFixed(1) + " " + y.toFixed(1) + " ";
      else throw new Error("can only be called after .beginPath()");
      return current;
    },
    lineWidth: function (w) {
      current.attr!["stroke-width"] = w;
    },
    moveTo: function (x, y) {
      if (inPathBuilderMode)
        current.children.at(-1)!.attr.d +=
          "M" + x.toFixed(1) + " " + y.toFixed(1) + " ";
      else throw new Error("can only be called after .beginPath()");
    },
    setData: function (name: string, value: string) {
      current.data = current.data ?? {};
      current.data["data-" + name] = value;
    },
    setLineDash: function (d) {
      current.attr!["stroke-dasharray"] =
        d.length === 0 ? "none" : d[0] + " " + d[1];
    },
    stroke: function () {
      inPathBuilderMode = false;
      current.children.at(-1)!.stroke();
    },
    textAlign: function (a) {
      current.attr!["text-align"] = a;
    },
    translate: function (dx, dy) {
      if (Number.isNaN(dx) || Number.isNaN(dy)) {
        throw new Error("dx and dy must be real numbers");
      }
      current.attr!.transform = `translate(${dx}, ${dy})`;
    },
    serialize: function () {
      return root.serialize();
    },
  };
}
