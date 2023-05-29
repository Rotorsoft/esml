"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgGraphics = void 0;
function encode(val) {
    if ("number" === typeof val)
        return val.toFixed(0);
    return (val ?? "")
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}
function attrs(attrs) {
    return Object.entries(attrs)
        .filter(([_, val]) => val)
        .map(([key, val]) => `${key}="${encode(val)}"`)
        .join(" ");
}
class SvgElement {
    constructor(type, attrs, parent, text) {
        this.type = type;
        this.attrs = attrs;
        this.parent = parent;
        this.text = text;
        this.children = [];
    }
    get group() {
        return this.parent;
    }
    attr(key, val) {
        this.attrs[key] = val;
        return this;
    }
    append(el) {
        el.parent = this;
        this.children.push(el);
        return el;
    }
    serialize() {
        const attr = attrs({ ...this.attrs });
        const body = this.children.map((o) => o.serialize()).join("") || encode(this.text);
        return `<${this.type} ${attr}>${body}</${this.type}>`;
    }
}
class SvgGraphics {
    _new(type, attr, text) {
        this.current.append(new SvgElement(type, attr, this.current, text));
    }
    constructor(attrs) {
        this.root = this.current = new SvgElement("g", {
            ...attrs,
            "data-name": "root",
        });
    }
    group(name, attrs) {
        const element = new SvgElement("g", {}, this.current);
        this.current.append(element);
        this.current = element;
        name && this.attr("data-name", name);
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
    attr(key, val) {
        this.current.attr(key, val);
        return this;
    }
    rect(x, y, width, height, attrs) {
        this._new("rect", { x, y, height, width, ...attrs });
    }
    path(path, close, attrs) {
        const d = path
            .map((p, i) => p.x && p.y
            ? (i ? "L" : "M") + p.x.toFixed(0) + " " + p.y.toFixed(0)
            : p.dx
                ? "h" + p.dx.toFixed(0)
                : p.dy
                    ? "v" + p.dy.toFixed(0)
                    : "")
            .join(" ")
            .concat(close ? " Z" : "");
        this._new("path", { ...attrs, d });
    }
    text(text, x, y, attrs) {
        this._new("text", { x, y, ...attrs }, text);
    }
    serialize() {
        return this.root.serialize();
    }
}
exports.SvgGraphics = SvgGraphics;
//# sourceMappingURL=SvgGraphics.js.map