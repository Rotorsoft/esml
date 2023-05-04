(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('graphre')) :
    typeof define === 'function' && define.amd ? define(['exports', 'graphre'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.esml = {}, global.graphre));
})(this, (function (exports, graphre) { 'use strict';

    function _interopNamespaceDefault(e) {
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () { return e[k]; }
                    });
                }
            });
        }
        n.default = e;
        return Object.freeze(n);
    }

    var graphre__namespace = /*#__PURE__*/_interopNamespaceDefault(graphre);

    const square = (node, config) => {
        node.x = 0;
        node.y = 0;
        node.width = config.scale;
        node.height = config.scale;
        node.offset = { x: 8, y: 8 };
    };
    const rectangle = (node, config) => {
        node.x = 0;
        node.y = 0;
        node.width = config.scale * 2;
        node.height = config.scale;
        node.offset = { x: 8, y: 8 };
    };

    const Types = [
        "context",
        "actor",
        "aggregate",
        "system",
        "projector",
        "policy",
        "process",
    ];
    const Edges = ["invokes", "handles", "emits", "includes"];
    const Keywords = [...Types, ...Edges];

    class Actor {
        grammar() {
            return { invokes: "command" };
        }
        edge(node, message) {
            return {
                start: node.id,
                end: message.id,
                dashed: false,
                arrow: true,
            };
        }
        layout(node, config) {
            node.x = 0;
            node.y = 0;
            node.width = config.scale / 2;
            node.height = config.scale / 2;
            node.offset = { x: 8, y: config.scale / 3 };
        }
    }

    class Aggregate {
        grammar() {
            return { handles: "command", emits: "event" };
        }
        edge(node, message) {
            return message.visual === "command"
                ? {
                    start: message.id,
                    end: node.id,
                    dashed: false,
                    arrow: true,
                }
                : {
                    start: node.id,
                    end: message.id,
                    dashed: false,
                    arrow: false,
                };
        }
        layout(node, config) {
            return rectangle(node, config);
        }
    }

    const magnitude = (v) => Math.sqrt(v.x * v.x + v.y * v.y);
    const difference = (a, b) => ({
        x: a.x - b.x,
        y: a.y - b.y,
    });
    const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
    const multiply = (v, factor) => ({
        x: factor * v.x,
        y: factor * v.y,
    });
    const normalize = (v) => multiply(v, 1 / magnitude(v));
    const rotate = (a) => ({ x: a.y, y: -a.x });
    const splitId = (text) => text.trim().split(/(?=[A-Z])/);
    const range = ([min, max], count) => {
        var output = [];
        for (var i = 0; i < count; i++)
            output.push(min + ((max - min) * i) / (count - 1));
        return output;
    };
    const debounce = (func, delay) => {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    };
    class EventEmitter {
        constructor() {
            this.listeners = new Map();
        }
        on(eventName, listener) {
            !this.listeners.has(eventName) && this.listeners.set(eventName, new Set());
            this.listeners.get(eventName).add(listener);
        }
        emit(eventName, ...args) {
            this.listeners.has(eventName) &&
                this.listeners.get(eventName).forEach((listener) => listener(...args));
        }
    }

    class Context {
        grammar() {
            return { includes: "artifacts" };
        }
        edge(node, message, dashed = false, arrow = true) {
            return { start: node.id, end: message.id, dashed, arrow };
        }
        layout(node, config) {
            if (node.nodes.size) {
                const g = new graphre__namespace.Graph({
                    multigraph: true,
                });
                g.setGraph({
                    nodesep: config.spacing,
                    edgesep: config.spacing,
                    ranksep: config.spacing,
                    acyclicer: "greedy",
                    rankdir: "LR",
                    ranker: "network-simplex",
                });
                node.nodes.forEach((n) => {
                    (n.artifact?.layout || square)(n, config);
                    n.width = n.width + 2 * config.edgeMargin;
                    n.height = n.height + 2 * config.edgeMargin;
                });
                node.nodes.forEach(({ id, width, height }) => g.setNode(id, { width, height }));
                const edges = [...node.edges.values()].map((edge, index) => {
                    g.setEdge(edge.start, edge.end, {}, `${index}`);
                    return edge;
                });
                graphre__namespace.layout(g);
                node.nodes.forEach((n) => {
                    const gn = g.node(n.id);
                    n.x = gn.x;
                    n.y = gn.y;
                });
                const r = [0, 0, 0, 0];
                for (const e of g.edges()) {
                    const ge = g.edge(e);
                    const ne = edges[parseInt(e.name)];
                    const start = node.nodes.get(e.v);
                    const end = node.nodes.get(e.w);
                    ne.path = [start, ...ge.points, end].map((n) => ({
                        x: n.x,
                        y: n.y,
                    }));
                    ge.points.forEach(({ x, y }) => {
                        r[0] = r[0] < x ? r[0] : x;
                        r[1] = r[1] > x ? r[1] : x;
                        r[2] = r[2] < y ? r[2] : y;
                        r[3] = r[3] < y ? r[3] : y;
                    });
                }
                const graph = g.graph();
                const width = Math.max(graph.width, r[1] - r[0]);
                const height = Math.max(graph.height, r[3] - r[2]);
                node.width = width + 2 * (config.gutter + config.padding);
                node.height =
                    height + config.fontSize + 2 * (config.gutter + config.padding);
                node.offset = { x: config.padding - r[0], y: config.padding - r[2] };
            }
            else {
                node.width =
                    splitId(node.id).join(" ").length * config.fontSize +
                        2 * config.padding;
                node.height = config.fontSize + 2 * config.padding;
                node.offset = { x: config.padding, y: config.padding };
            }
        }
    }

    class Policy {
        grammar() {
            return { handles: "event", invokes: "command" };
        }
        edge(node, message) {
            return message.visual === "event"
                ? {
                    start: message.id,
                    end: node.id,
                    dashed: true,
                    arrow: true,
                }
                : {
                    start: node.id,
                    end: message.id,
                    dashed: false,
                    arrow: true,
                };
        }
        layout(node, config) {
            return rectangle(node, config);
        }
    }

    class Process {
        grammar() {
            return { handles: "event", invokes: "command" };
        }
        edge(node, message) {
            return message.visual === "event"
                ? {
                    start: message.id,
                    end: node.id,
                    dashed: true,
                    arrow: true,
                }
                : {
                    start: node.id,
                    end: message.id,
                    dashed: false,
                    arrow: true,
                };
        }
        layout(node, config) {
            return rectangle(node, config);
        }
    }

    class Projector {
        grammar() {
            return { handles: "event" };
        }
        edge(node, message) {
            return {
                start: message.id,
                end: node.id,
                dashed: true,
                arrow: true,
            };
        }
        layout(node, config) {
            return rectangle(node, config);
        }
    }

    class System {
        grammar() {
            return { handles: "command", emits: "event" };
        }
        edge(node, message) {
            return message.visual === "command"
                ? {
                    start: message.id,
                    end: node.id,
                    dashed: false,
                    arrow: true,
                }
                : {
                    start: node.id,
                    end: message.id,
                    dashed: false,
                    arrow: false,
                };
        }
        layout(node, config) {
            return rectangle(node, config);
        }
    }

    const artifacts = {
        actor: new Actor(),
        aggregate: new Aggregate(),
        context: new Context(),
        policy: new Policy(),
        process: new Process(),
        projector: new Projector(),
        system: new System(),
    };

    const sizeText = (node) => {
        const words = splitId(node.id);
        const maxWord = words.reduce((max, word) => Math.max(max, word.length), 0);
        let fontSize = Math.max(Math.min(Math.ceil(node.width / maxWord), 24), 8);
        while (fontSize > 8) {
            const maxWidth = Math.floor(node.width / fontSize);
            const maxHeight = Math.floor(node.height / fontSize);
            const lines = [];
            let line = words[0];
            let n = 1;
            while (n < words.length) {
                const word = words[n++];
                if (line.length + word.length >= maxWidth) {
                    lines.push(line);
                    line = word;
                }
                else
                    line = line.concat(line.length ? " " : "", word);
            }
            lines.push(line);
            if (n === words.length && lines.length < maxHeight)
                return {
                    lines,
                    fontSize,
                };
            fontSize--;
        }
        return {
            lines: words,
            fontSize,
        };
    };
    const renderLines = (lines, g, fontSize, width, height, padding) => {
        g.setFont(fontSize, "normal", "normal");
        g.textAlign("center");
        const lineHeight = fontSize * 1.15;
        const topMargin = (fontSize + height - lines.length * lineHeight) / 2;
        const x = width / 2 - padding;
        lines.forEach((line, i) => {
            const y = topMargin + i * lineHeight;
            g.fillText(line, x, y);
        });
    };
    const getPath = (edge, config) => {
        const path = edge.path.slice(1, -1);
        const endDir = normalize(difference(path[path.length - 2], path.at(-1)));
        const size = (config.spacing * config.arrowSize) / 30;
        const end = path.length - 1;
        const copy = path.map((p) => ({ x: p.x, y: p.y }));
        copy[end] = add(copy[end], multiply(endDir, size * (edge.arrow ? 5 : 0)));
        return copy;
    };
    const renderArrow = (edge, g, config) => {
        if (edge.arrow) {
            const end = edge.path[edge.path.length - 2];
            const path = edge.path.slice(1, -1);
            const size = (config.spacing * config.arrowSize) / 30;
            const dir = normalize(difference(path[path.length - 2], path.at(-1)));
            const x = (s) => add(end, multiply(dir, s * size));
            const y = (s) => multiply(rotate(dir), s * size);
            const circuit = [add(x(10), y(4)), x(5), add(x(10), y(-4)), end];
            g.fillStyle(config.stroke);
            g.circuit(circuit).fillAndStroke();
        }
    };
    const renderEdge = (edge, g, config) => {
        const path = getPath(edge, config);
        g.strokeStyle(config.stroke);
        if (edge.dashed) {
            var dash = Math.max(4, 2 * config.lineWidth);
            g.group();
            {
                g.setLineDash([dash, dash]);
                g.path(path).stroke();
            }
            g.ungroup();
        }
        else
            g.path(path).stroke();
        renderArrow(edge, g, config);
    };
    const context = {
        style: {
            stroke: "#CCCCCC",
            fill: "white",
        },
        renderShape: (node, g, x, y) => {
            node.id && g.rect(x, y, node.width, node.height).fillAndStroke();
        },
        renderContents: (node, g, config) => {
            g.setFont(config.fontSize, "normal", "normal");
            g.textAlign("left");
            const x = 0;
            const y = config.fontSize;
            g.fillText(splitId(node.id).join(" "), x, y);
            g.group();
            g.translate(config.gutter, config.gutter);
            node.edges.forEach((r) => renderEdge(r, g, config));
            node.nodes.forEach((n) => renderNode(n, g, config));
            g.ungroup();
        },
    };
    const actor = {
        style: {
            stroke: "#555555",
            fill: "white",
        },
        renderShape: (node, g, x, y, config) => {
            const a = config.padding / 2;
            const yp = y + a * 4;
            const faceCenter = { x: node.x, y: yp - a };
            g.circle(faceCenter, a).stroke();
            g.path([
                { x: node.x, y: yp },
                { x: node.x, y: yp + 2 * a },
            ]).stroke();
            g.path([
                { x: node.x - a, y: yp + a },
                { x: node.x + a, y: yp + a },
            ]).stroke();
            g.path([
                { x: node.x - a, y: yp + a + config.padding },
                { x: node.x, y: yp + config.padding },
                { x: node.x + a, y: yp + a + config.padding },
            ]).stroke();
        },
        renderContents: (node, g, config) => {
            const lines = splitId(node.id);
            renderLines(lines, g, config.fontSize, node.width, node.height, config.padding);
        },
    };
    const COLORS = {
        context: "white",
        actor: "white",
        aggregate: "#fffabb",
        system: "#eca0c3",
        projector: "#d5f694",
        policy: "#c595cd",
        process: "#c595cd",
        command: "#7adcfb",
        event: "#ffaa61",
    };
    const note = (visual) => ({
        style: {
            stroke: "#555555",
            fill: COLORS[visual],
        },
        renderShape: (node, g, x, y) => {
            const style = "filter: drop-shadow(0px 5px 5px rgba(0, 0, 0, 0.5));";
            g.rect(x, y, node.width, node.height, style).fill();
        },
        renderContents: (node, g, config) => {
            const { lines, fontSize } = sizeText(node);
            renderLines(lines, g, fontSize, node.width, node.height, config.padding);
        },
    });
    const renderable = (visual) => {
        if (visual === "context")
            return context;
        if (visual === "actor")
            return actor;
        return note(visual);
    };
    const renderNode = (node, g, config) => {
        const { style, renderShape, renderContents } = renderable(node.visual);
        const x = node.x - node.width / 2;
        const y = node.y - node.height / 2;
        g.group();
        {
            g.setData("name", node.id);
            g.group();
            {
                g.fillStyle(style.fill);
                g.strokeStyle(style.stroke);
                renderShape(node, g, x, y, config);
            }
            g.ungroup();
            g.group();
            {
                node.id && g.translate(x, y);
                g.group();
                {
                    g.translate(node.offset.x, node.offset.y);
                    g.fillStyle(style.stroke);
                    renderContents(node, g, config);
                }
                g.ungroup();
            }
            g.ungroup();
        }
        g.ungroup();
    };
    const renderRoot = (root, g, config) => {
        g.group();
        {
            g.clear();
            g.group();
            {
                g.strokeStyle("transparent");
                g.fillStyle(config.background);
                g.rect(0, 0, root.width, root.height).fill();
            }
            g.ungroup();
            g.setFontFamily(config.font);
            g.lineWidth(config.lineWidth);
            g.lineJoin("round");
            g.lineCap("round");
            renderNode(root, g, config);
        }
        g.ungroup();
    };

    function toAttrString(obj) {
        return Object.entries(obj)
            .filter(([_, val]) => val !== undefined)
            .map(([key, val]) => `${key}="${xmlEncode(val)}"`)
            .join(" ");
    }
    function xmlEncode(str) {
        if ("number" === typeof str)
            return str.toFixed(1);
        return (str ?? "")
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
    }
    function svg() {
        const initialState = { "stroke-width": 1 };
        class Element {
            constructor(name, attr, parent, text) {
                this.elideEmpty = false;
                this.name = name;
                this.attr = attr;
                this.parent = parent;
                this.children = [];
                this.text = text || undefined;
            }
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
            serialize() {
                const data = getDefined(this.group(), (e) => e.data) ?? {};
                const attrs = toAttrString({ ...this.attr, ...data });
                const content = this.children.map((o) => o.serialize()).join("");
                if (this.name === "svg")
                    return content;
                else if (this.text && this.children.length === 0)
                    return `<${this.name} ${attrs}>${xmlEncode(this.text)}</${this.name}>`;
                else if (this.children.length === 0)
                    return this.elideEmpty ? "" : `<${this.name} ${attrs}></${this.name}>`;
                else
                    return `<${this.name} ${attrs}>${content}</${this.name}>`;
            }
        }
        function getDefined(group, getter) {
            if (!group)
                return getter(syntheticRoot);
            return (getter(group) ??
                getDefined(group.parent, getter) ??
                getter(syntheticRoot));
        }
        class GroupElement extends Element {
            constructor(parent) {
                super("g", {}, parent);
                this.elideEmpty = true;
                this.attr = {};
                this.data = {};
            }
            group() {
                return this;
            }
        }
        const syntheticRoot = new GroupElement({});
        syntheticRoot.attr = initialState;
        var root = new Element("svg", {
            version: "1.1",
            baseProfile: "full",
            xmlns: "http://www.w3.org/2000/svg",
            "xmlns:xlink": "http://www.w3.org/1999/xlink",
            "xmlns:ev": "http://www.w3.org/2001/xml-events",
        }, undefined);
        var current = new GroupElement(root);
        current.attr = initialState;
        root.children.push(current);
        var inPathBuilderMode = false;
        function tracePath(path, offset = { x: 0, y: 0 }, s = 1) {
            var d = path
                .map((e, i) => (i ? "L" : "M") +
                (offset.x + s * e.x).toFixed(1) +
                " " +
                (offset.y + s * e.y).toFixed(1))
                .join(" ");
            return el("path", { d: d });
        }
        function el(type, attr, text) {
            var element = new Element(type, attr, current, text);
            current.children.push(element);
            return element;
        }
        return {
            group: function () {
                const node = new GroupElement(current);
                current.children.push(node);
                current = node;
            },
            ungroup: function () {
                if (current.parent)
                    current = current.parent;
            },
            width: function () {
                return 0;
            },
            height: function () {
                return 0;
            },
            clear: function () { },
            circle: function (p, r) {
                return el("circle", { r: r, cx: p.x, cy: p.y });
            },
            ellipse: function (center, w, h, start = 0, stop = 0) {
                if (start || stop) {
                    var path = range([start, stop], 64).map((a) => add(center, { x: (Math.cos(a) * w) / 2, y: (Math.sin(a) * h) / 2 }));
                    return tracePath(path);
                }
                else {
                    return el("ellipse", {
                        cx: center.x,
                        cy: center.y,
                        rx: w / 2,
                        ry: h / 2,
                    });
                }
            },
            arc: function (cx, cy, r) {
                return el("ellipse", { cx, cy, rx: r, ry: r });
            },
            roundRect: function (x, y, width, height, r) {
                return el("rect", { x, y, rx: r, ry: r, height, width });
            },
            rect: function (x, y, width, height, style) {
                return el("rect", { x, y, height, width, style: style || "" });
            },
            path: tracePath,
            circuit: function (path, offset, s) {
                var element = tracePath(path, offset, s);
                element.attr.d += " Z";
                return element;
            },
            setFontFamily: function (family) {
                current.attr["font-family"] = family;
            },
            setFont: function (size, weight, style) {
                current.attr["font-size"] = size + "pt";
                current.attr["font-weight"] = weight;
                current.attr["font-style"] = style;
            },
            strokeStyle: function (stroke) {
                current.attr.stroke = stroke;
            },
            fillStyle: function (fill) {
                current.attr.fill = fill;
            },
            arcTo: function (x1, y1, x2, y2) {
                if (inPathBuilderMode)
                    current.children.at(-1).attr.d +=
                        "L" + x1 + " " + y1 + " L" + x2 + " " + y2 + " ";
                else
                    throw new Error("can only be called after .beginPath()");
            },
            beginPath: function () {
                inPathBuilderMode = true;
                return el("path", { d: "" });
            },
            fillText: function (text, x, y) {
                return el("text", {
                    x,
                    y,
                    stroke: "none",
                    "text-anchor": getDefined(current, (e) => e.attr["text-align"]) === "center"
                        ? "middle"
                        : "",
                }, text);
            },
            lineCap: function (cap) {
                current.attr["stroke-linecap"] = cap;
            },
            lineJoin: function (join) {
                current.attr["stroke-linejoin"] = join;
            },
            lineTo: function (x, y) {
                if (inPathBuilderMode)
                    current.children.at(-1).attr.d +=
                        "L" + x.toFixed(1) + " " + y.toFixed(1) + " ";
                else
                    throw new Error("can only be called after .beginPath()");
                return current;
            },
            lineWidth: function (w) {
                current.attr["stroke-width"] = w;
            },
            moveTo: function (x, y) {
                if (inPathBuilderMode)
                    current.children.at(-1).attr.d +=
                        "M" + x.toFixed(1) + " " + y.toFixed(1) + " ";
                else
                    throw new Error("can only be called after .beginPath()");
            },
            setData: function (name, value) {
                current.data = current.data ?? {};
                current.data["data-" + name] = value;
            },
            setLineDash: function (d) {
                current.attr["stroke-dasharray"] =
                    d.length === 0 ? "none" : d[0] + " " + d[1];
            },
            stroke: function () {
                inPathBuilderMode = false;
                current.children.at(-1).stroke();
            },
            textAlign: function (a) {
                current.attr["text-align"] = a;
            },
            translate: function (dx, dy) {
                if (Number.isNaN(dx) || Number.isNaN(dy)) {
                    throw new Error("dx and dy must be real numbers");
                }
                current.attr.transform = `translate(${dx}, ${dy})`;
            },
            serialize: function () {
                return root.serialize();
            },
        };
    }

    const renderSvg = (root, config) => {
        const g = svg();
        artifacts.context.layout(root, config);
        renderRoot(root, g, config);
        return {
            svg: g.serialize(),
            width: root.width,
            height: root.height,
        };
    };

    class ParseError extends Error {
        constructor(expected, actual, line, from, to) {
            super(`Parser error at line ${line}: Expected ${expected} but got ${actual}`);
            this.expected = expected;
            this.actual = actual;
            this.line = line;
            this.from = from;
            this.to = to;
        }
    }
    const parse = (source) => {
        const cursor = { index: 0, line: 1, line_index: 0 };
        const parser = { index: 0, line: 1, line_index: 0 };
        const error = (expected, actual) => {
            const from = (parser.token_index || parser.line_index) - parser.line_index;
            const to = parser.index - parser.line_index;
            const trimmed = actual.length > 30 ? actual.substring(0, 30) + "..." : actual;
            throw new ParseError(expected, trimmed, parser.line, from, to);
        };
        const statements = new Map();
        const BLANKS = ["\t", " ", "\n"];
        const skipBlanks = () => {
            while (cursor.index < source.length) {
                const char = source.charAt(cursor.index);
                if (char === "\n") {
                    cursor.index++;
                    cursor.line++;
                    cursor.line_index = cursor.index;
                }
                else if (BLANKS.includes(char))
                    cursor.index++;
                else
                    break;
            }
        };
        const nextToken = () => {
            skipBlanks();
            let partial = "";
            let token = "";
            let char = "";
            while (cursor.index < source.length) {
                if (parser.index != cursor.index) {
                    parser.index = cursor.index;
                    parser.line = cursor.line;
                    parser.line_index = cursor.line_index;
                    parser.token_index = cursor.index;
                }
                char = source.charAt(cursor.index);
                if ((char >= "a" && char <= "z") ||
                    (char >= "A" && char <= "Z") ||
                    (partial.length && char >= "0" && char <= "9")) {
                    partial += char;
                    token += char;
                    cursor.index++;
                    if (parser.line === cursor.line)
                        parser.index = cursor.index;
                }
                else if (![",", ...BLANKS].includes(char)) {
                    error("identifier", char);
                }
                else {
                    skipBlanks();
                    if (cursor.index < source.length) {
                        char = source.charAt(cursor.index);
                        if (char !== ",")
                            break;
                        partial = "";
                        token += char;
                        cursor.index++;
                        if (parser.line === cursor.line)
                            parser.index = cursor.index;
                        skipBlanks();
                    }
                }
            }
            return token;
        };
        const notKeyword = (token, expected) => {
            if ([...Keywords].includes(token))
                error(expected, token);
        };
        const parseStatement = (type) => {
            const name = nextToken();
            !name && error("name", "nothing");
            name.indexOf(",") > 0 && error("name", "names");
            notKeyword(name, "name");
            !statements.has(name) && statements.set(name, { type, rels: new Map() });
            let token = nextToken();
            if (type.includes(token))
                return token;
            const statement = statements.get(name);
            const grammar = artifacts[type].grammar();
            while (token in grammar) {
                const rel = grammar[token];
                const names = nextToken();
                !names && error("names", "nothing");
                names.split(",").forEach((n) => notKeyword(n.trim(), "names"));
                names
                    .split(",")
                    .filter(Boolean)
                    .forEach((n) => statement?.rels.set(n, rel === "artifacts" ? undefined : rel));
                token = nextToken();
            }
            return token;
        };
        const producer = (av, mv) => {
            const sys = av === "aggregate" || av === "system";
            return sys ? mv === "event" : mv === "command";
        };
        const _msgCtxs = new Map();
        const trackCtx = (context, anode, mnode) => {
            let mm = _msgCtxs.get(mnode.id);
            if (!mm) {
                mm = new Map();
                _msgCtxs.set(mnode.id, mm);
            }
            const is_producer = producer(anode.visual, mnode.visual);
            let ctx = mm.get(context.id);
            if (!ctx) {
                ctx = { context, visual: mnode.visual, producer: is_producer };
                mm.set(context.id, ctx);
            }
            else if (!ctx.producer && is_producer)
                ctx.producer = is_producer;
        };
        const addNode = (context, id) => {
            const statement = statements.get(id);
            if (statement && statement.type !== "context" && !statement.context) {
                statement.context = context.id;
                const artifact = artifacts[statement.type];
                const anode = { id, visual: statement.type, artifact };
                statement.rels.forEach((visual, id) => {
                    const rel = statements.get(id);
                    (rel?.type || visual) === "context" && error("component", id);
                    !visual && !rel && error("declared component", id);
                    const mnode = { id, visual: visual || rel.type };
                    context.edges.add(artifact.edge(anode, mnode));
                    context.nodes.set(id, mnode);
                    trackCtx(context, anode, mnode);
                });
                context.nodes.set(id, anode);
            }
        };
        let type = nextToken();
        while (type) {
            if (Types.includes(type)) {
                type = parseStatement(type);
            }
            else
                error("keyword", type);
        }
        const context = (id = "") => ({
            id,
            visual: "context",
            artifact: artifacts.context,
            nodes: new Map(),
            edges: new Set(),
        });
        const root = context();
        statements.forEach((statement, id) => {
            if (statement.type === "context") {
                const node = context(id);
                statement.rels.forEach((_, id) => addNode(node, id));
                root.nodes.set(id, node);
            }
        });
        const global = context("global");
        statements.forEach((statement, id) => statement.type !== "context" && !statement.context && addNode(global, id));
        global.nodes?.size && root.nodes.set("global", global);
        _msgCtxs.forEach((x) => {
            if (x.size > 1) {
                const producers = [...x.values()].filter((c) => c.producer);
                const consumers = [...x.values()].filter((c) => !c.producer);
                producers.forEach((p) => {
                    consumers.forEach((c) => {
                        root.edges.add(artifacts.context.edge(p.context, c.context, p.visual === "event"));
                    });
                });
            }
        });
        return root;
    };

    const esml = (code, scale) => {
        const config = {
            arrowSize: 0.5,
            gutter: 20,
            edgeMargin: 0,
            gravity: Math.round(+1),
            background: "#f8f9fa",
            font: "Handlee,Caveat,Inconsolata,Monospace",
            fontSize: scale / 10,
            leading: 1.25,
            lineWidth: 1,
            padding: 8,
            spacing: 40,
            stroke: "#CCCCCC",
            scale,
        };
        try {
            const root = parse(code);
            return renderSvg(root, config);
        }
        catch (error) {
            return { error };
        }
    };

    const MIN_X = 0, MIN_Y = 0;
    class Canvas extends EventEmitter {
        constructor(document, container, options) {
            super();
            this.SCALE = 80;
            this.WIDTH = this.SCALE * 100;
            this.HEIGHT = this.SCALE * 100;
            this.zoom = 1;
            this.x = 0;
            this.y = 0;
            this.w = 0;
            this.h = 0;
            if (options) {
                this.SCALE = options.SCALE;
                this.WIDTH = options.WIDTH;
                this.HEIGHT = options.HEIGHT;
                this.coordsSpan = options.coordsSpan;
                this.zoomSpan = options.zoomSpan;
                this.fitBtn = options.fitBtn;
            }
            this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            this.svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
            this.svg.setAttribute("viewBox", `${MIN_X} ${MIN_Y} ${this.WIDTH} ${this.HEIGHT}`);
            this.svg.setAttribute("width", `${this.WIDTH}`);
            this.svg.setAttribute("height", `${this.HEIGHT}`);
            container.appendChild(this.svg);
            container.addEventListener("wheel", (event) => {
                event.preventDefault();
                if (event.metaKey || event.ctrlKey) {
                    this.fitZoom(this.zoom + event.deltaY * -0.01);
                    this.transform();
                }
                else {
                    this.transform(event.deltaX, event.deltaY);
                }
            });
            this.fitBtn &&
                (this.fitBtn.onclick = () => {
                    const vw = container.clientWidth;
                    const vh = container.clientHeight;
                    this.fitZoom(Math.min(vw / this.w, vh / this.h));
                    this.x = Math.floor((vw - this.w * this.zoom) / 2);
                    this.y = Math.floor((vh - this.h * this.zoom) / 2);
                    this.transform();
                });
        }
        fitZoom(z) {
            this.zoom = Math.round(Math.min(Math.max(0.1, z), 3) * 100) / 100;
        }
        transform(dx = 0, dy = 0) {
            const g = this.svg.children[0];
            if (g) {
                this.x = Math.floor(Math.min(Math.max(this.x - dx, MIN_X - this.w * this.zoom), this.WIDTH));
                this.y = Math.floor(Math.min(Math.max(this.y - dy, MIN_Y - this.h * this.zoom), this.HEIGHT));
                this.coordsSpan &&
                    (this.coordsSpan.innerText = `x:${this.x} y:${this.y} w:${this.w} h:${this.h}`);
                this.zoomSpan &&
                    (this.zoomSpan.innerText = `${Math.floor(this.zoom * 100)}%`);
                g.setAttribute("transform", `translate(${this.x}, ${this.y}) scale(${this.zoom})`);
                this.emit("transformed", {
                    x: this.x,
                    y: this.y,
                    zoom: this.zoom,
                });
            }
        }
        render({ code, x, y, zoom }) {
            const { error, svg, width, height } = esml(code, this.SCALE);
            if (error)
                return error;
            this.w = width;
            this.h = height;
            this.svg.innerHTML = svg;
            if (x && y && zoom) {
                this.x = x;
                this.y = y;
                this.zoom = zoom;
            }
            this.transform();
        }
    }

    exports.Canvas = Canvas;
    exports.Keywords = Keywords;
    exports.debounce = debounce;
    exports.esml = esml;

}));
