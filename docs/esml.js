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

    class Actor {
        grammar() {
            return {
                invokes: { visual: "command", owns: true },
                reads: { visual: "projector", owns: false },
            };
        }
        edge(node, ref) {
            if (ref.visual === "command")
                return {
                    start: node.id,
                    end: ref.id,
                    dashed: false,
                    arrow: true,
                };
        }
        ref(node, ref) {
            if (ref.visual === "projector")
                return { hostId: node.id, target: ref };
        }
    }

    class Aggregate {
        grammar() {
            return {
                handles: { visual: "command", owns: true },
                emits: { visual: "event", owns: true },
            };
        }
        edge(node, ref) {
            return ref.visual === "command"
                ? {
                    start: ref.id,
                    end: node.id,
                    dashed: false,
                    arrow: true,
                }
                : {
                    start: node.id,
                    end: ref.id,
                    dashed: false,
                    arrow: false,
                };
        }
        ref() {
            return undefined;
        }
    }

    class Context {
        grammar() {
            return { includes: { visual: "artifact", owns: true } };
        }
        edge(node, ref, dashed = false, arrow = true) {
            return { start: node.id, end: ref.id, dashed, arrow };
        }
        ref() {
            return undefined;
        }
    }

    class Policy {
        grammar() {
            return {
                handles: { visual: "event", owns: false },
                invokes: { visual: "command", owns: false },
                reads: { visual: "projector", owns: false },
            };
        }
        edge(node, ref) {
            if (ref.visual === "event")
                return {
                    start: ref.id,
                    end: node.id,
                    dashed: true,
                    arrow: true,
                };
        }
        ref(node, ref) {
            if (ref.visual === "command")
                return { hostId: ref.id, target: node };
            if (ref.visual === "projector")
                return { hostId: node.id, target: ref };
        }
    }

    class Process {
        grammar() {
            return {
                handles: { visual: "event", owns: false },
                invokes: { visual: "command", owns: false },
                reads: { visual: "projector", owns: false },
            };
        }
        edge(node, ref) {
            if (ref.visual === "event")
                return {
                    start: ref.id,
                    end: node.id,
                    dashed: true,
                    arrow: true,
                };
        }
        ref(node, ref) {
            if (ref.visual === "command")
                return { hostId: ref.id, target: node };
            if (ref.visual === "projector")
                return { hostId: node.id, target: ref };
        }
    }

    class Projector {
        grammar() {
            return { handles: { visual: "event", owns: false } };
        }
        edge(node, ref) {
            return {
                start: ref.id,
                end: node.id,
                dashed: true,
                arrow: true,
            };
        }
        ref() {
            return undefined;
        }
    }

    class System {
        grammar() {
            return {
                handles: { visual: "command", owns: true },
                emits: { visual: "event", owns: true },
            };
        }
        edge(node, ref) {
            return ref.visual === "command"
                ? {
                    start: ref.id,
                    end: node.id,
                    dashed: false,
                    arrow: true,
                }
                : {
                    start: node.id,
                    end: ref.id,
                    dashed: false,
                    arrow: false,
                };
        }
        ref() {
            return undefined;
        }
    }

    const Types = [
        "context",
        "actor",
        "aggregate",
        "system",
        "projector",
        "policy",
        "process",
    ];
    const Actions = ["invokes", "handles", "emits", "includes", "reads"];
    const Keywords = [...Types, ...Actions];
    const isContextNode = (node) => "nodes" in node;

    const artifacts = {
        actor: new Actor(),
        aggregate: new Aggregate(),
        context: new Context(),
        policy: new Policy(),
        process: new Process(),
        projector: new Projector(),
        system: new System(),
    };

    class CompilerError extends Error {
        constructor(source, expected, actual) {
            super(`Compiler error at line ${source.from.line}: Expected ${expected} but got ${actual}`);
            this.source = source;
            this.expected = expected;
            this.actual = actual;
        }
    }
    const error = (statement, expected, actual) => {
        throw new CompilerError(statement.source, expected, actual);
    };
    const newContext = (id = "") => ({
        id,
        visual: "context",
        nodes: new Map(),
        edges: new Set(),
        refs: new Map(),
        x: 0,
        y: 0,
    });
    const compile = (statements) => {
        const nodes = new Map();
        const newNode = (statement, id, visual, owns) => {
            const found = nodes.get(id);
            if (found) {
                if (found.visual !== visual)
                    error(statement, `${id} as ${found.visual}`, visual);
                !found.ctx && owns && (found.ctx = statement.context);
                return found;
            }
            const node = { id, visual };
            owns && (node.ctx = statement.context);
            nodes.set(id, node);
            return node;
        };
        const addNode = (context, id) => {
            const statement = statements.get(id);
            if (statement && statement.type !== "context" && !statement.context) {
                statement.context = context.id;
                const node = newNode(statement, id, statement.type, true);
                statement.rels.forEach(({ visual, owns }, id) => {
                    const ref = statements.get(id);
                    ref?.type === "context" && error(statement, "component", id);
                    if (visual === "artifact")
                        error(statement, "valid relationship", visual);
                    else
                        newNode(statement, id, visual, owns);
                });
                context.nodes.set(id, node);
            }
        };
        const root = newContext();
        statements.forEach((statement, id) => {
            if (statement.type === "context") {
                const node = newContext(id);
                statement.rels.forEach((_, id) => addNode(node, id));
                root.nodes.set(id, node);
            }
        });
        const global = newContext("global");
        statements.forEach((statement, id) => {
            if (statement.type !== "context" && !statement.context) {
                addNode(global, id);
            }
        });
        global.nodes.size && root.nodes.set("global", global);
        const ctxmap = new Set();
        statements.forEach((statement, id) => {
            if (statement.type !== "context") {
                const artifact = artifacts[statement.type];
                const node = nodes.get(id);
                const ctx = root.nodes.get(node.ctx);
                statement.rels.forEach(({ visual }, id) => {
                    const rel = nodes.get(id);
                    if (rel.ctx && node.ctx !== rel.ctx) {
                        const ref_ctx = root.nodes.get(rel.ctx);
                        const sys = statement.type === "aggregate" || statement.type === "system";
                        const is_consumer = (visual === "event" && !sys) ||
                            (visual === "command" && sys) ||
                            (visual === "projector" && statement.type !== "projector");
                        const producer = is_consumer ? ref_ctx : ctx;
                        const consumer = is_consumer ? ctx : ref_ctx;
                        const edge = artifacts.context.edge(producer, consumer);
                        if (edge) {
                            const key = `${producer.id}->${consumer.id}`;
                            if (!ctxmap.has(key)) {
                                root.edges.add(edge);
                                ctxmap.add(key);
                            }
                        }
                    }
                    if (node.ctx === rel.ctx || rel.visual === "event") {
                        const clone = { ...rel };
                        const edge = artifact.edge(node, clone);
                        edge && ctx.edges.add(edge);
                        ctx.nodes.set(id, clone);
                    }
                    const ref = artifact.ref(node, rel);
                    if (ref) {
                        !ctx.refs.has(ref.hostId) && ctx.refs.set(ref.hostId, new Map());
                        ctx.refs.get(ref.hostId).set(`${ref.hostId},${ref.target.id}`, ref);
                    }
                });
            }
        });
        return root;
    };

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

    const square = (node, config) => {
        node.x = 0;
        node.y = 0;
        node.width = config.scale;
        node.height = config.scale;
    };
    const rectangle = (node, config) => {
        node.x = 0;
        node.y = 0;
        node.width = config.scale * 2;
        node.height = config.scale;
    };
    const half_rectangle = (node, config) => {
        node.x = 0;
        node.y = 0;
        node.width = config.scale;
        node.height = config.scale / 2;
    };
    const layout = (root, config) => {
        function layouter(visual) {
            switch (visual) {
                case "context":
                    return layoutContext;
                case "actor":
                    return half_rectangle;
                case "command":
                case "event":
                    return square;
                default:
                    return rectangle;
            }
        }
        const layoutContext = (node, config) => {
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
                node.nodes.forEach((n) => layouter(n.visual)(n, config));
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
                node.width = width + 2 * config.padding;
                node.height = height + 2 * config.padding;
            }
            else {
                node.width =
                    config.padding * 2 +
                        splitId(node.id).join(" ").length * config.fontSize;
                node.height = config.padding * 3 + config.fontSize;
            }
        };
        return layoutContext(root, config);
    };

    const pickFontSize = (words, w) => {
        const wordLengths = words.map((w) => w.length);
        const maxWord = wordLengths.sort().at(-1) || 0;
        const pairLenghts = wordLengths.map((l, i) => (i ? wordLengths[i - 1] + l + 1 : l)) || 0;
        const maxPair = pairLenghts.sort().at(-1) || 0;
        const minSize = Math.floor(w / 8);
        const size1 = Math.max(Math.floor(w / maxWord), minSize);
        const size2 = Math.max(Math.floor(w / maxPair), minSize);
        return Math.floor(Math.min(size1, size2, 30));
    };
    const sizeText = (text, w, h) => {
        let fontSize = pickFontSize(text, w);
        while (fontSize > 5) {
            const maxWidth = Math.floor(w / fontSize);
            const maxHeight = Math.floor(h / fontSize);
            const lines = [];
            let line = text[0];
            let n = 1;
            while (n < text.length) {
                const word = text[n++];
                if (line.length + word.length >= maxWidth) {
                    lines.push(line);
                    line = word;
                }
                else
                    line = line.concat(line.length ? " " : "", word);
            }
            lines.push(line);
            if (n === text.length && lines.length <= maxHeight)
                return {
                    lines,
                    fontSize,
                };
            fontSize--;
        }
        return {
            lines: text,
            fontSize,
        };
    };
    const renderText = (node, text, g, config, options = { fit: true }) => {
        const style = renderable(node.visual).style;
        const width = options.width || node.width || 0;
        const height = options.height || node.height || 0;
        const { lines, fontSize } = options.fit
            ? sizeText(text, width * config.font.widthScale, height * 0.8)
            : {
                lines: text,
                fontSize: options.fontSize || config.fontSize,
            };
        g.setFont(fontSize);
        const x = options.x || Math.floor(width / 2);
        const y = options.y || Math.floor(height / 2);
        const m = Math.floor(lines.length / 2);
        const h = config.font.heightScale;
        const o = lines.length % 2 ? h : h * 2;
        lines.forEach((line, i) => {
            g.fillText(line, x, y, style.stroke, `${(i - m) * 1.2 + o}em`);
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
            g.group(0, 0);
            var dash = Math.max(4, 2 * config.lineWidth);
            g.setLineDash([dash, dash]);
            g.path(path).stroke();
            g.ungroup();
        }
        else
            g.path(path).stroke();
        renderArrow(edge, g, config);
    };
    const renderRefs = (context, refs, g, config) => {
        const align = refs.length > 1 ? "left" : "center";
        const text = refs.length > 1
            ? refs.map((r) => `- ${splitId(r.target.id).join(" ")}`)
            : splitId(refs[0].target.id);
        const { hostId, target } = refs[0];
        const host = context.nodes.get(hostId);
        if (!host)
            return;
        const x = Math.floor(host.x - host.width / 2 - config.scale * 0.2);
        const y = Math.floor(host.y + host.height * 0.4);
        const w = Math.floor(host.width);
        const h = Math.floor(config.scale * 0.4);
        g.group(0, 0);
        {
            g.setData("name", `refs-${hostId}`);
            g.fillStyle(COLORS[target.visual]);
            g.textAlign(align);
            const style = "filter: drop-shadow(0px 5px 5px rgba(0, 0, 0, 0.5));";
            g.rect(x, y, w, h, style).fill();
            renderText(host, text, g, config, {
                fit: true,
                x: align === "center" ? x + w / 2 : x + config.scale * 0.05,
                y: y + h / 2,
                width: w,
                height: h,
            });
        }
        g.ungroup();
    };
    const context = {
        style: {
            stroke: "#AAAAAA",
            fill: "white",
        },
        renderShape: (node, g) => {
            g.rect(0, 0, node.width, node.height).fillAndStroke();
        },
        renderContents: (node, g, config) => {
            if (isContextNode(node)) {
                if (node.id) {
                    const words = splitId(node.id);
                    g.fillText(words.join(" "), config.fontSize * words.length, -config.fontSize, context.style.stroke);
                }
                g.group(config.padding, config.padding);
                {
                    g.textAlign("center");
                    node.edges.forEach((e) => renderEdge(e, g, config));
                    node.nodes.forEach((n) => renderNode(n, g, config));
                    node.refs.forEach((r) => renderRefs(node, [...r.values()], g, config));
                }
                g.ungroup();
            }
        },
    };
    const COLORS = {
        context: "white",
        actor: "#ffc107",
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
        renderShape: (node, g) => {
            const style = "filter: drop-shadow(0px 5px 5px rgba(0, 0, 0, 0.5));";
            g.rect(0, 0, node.width, node.height, style).fill();
        },
        renderContents: (node, g, config) => renderText(node, splitId(node.id), g, config),
    });
    const renderable = (visual) => visual === "context" ? context : note(visual);
    const renderNode = (node, g, config) => {
        const { style, renderShape, renderContents } = renderable(node.visual);
        const dx = Math.floor(node.x - node.width / 2);
        const dy = Math.floor(node.y - node.height / 2);
        g.group(dx, dy);
        {
            g.setData("name", node.id);
            g.fillStyle(style.fill);
            renderShape(node, g, config);
            renderContents(node, g, config);
        }
        g.ungroup();
    };
    const render = (root, g, config) => {
        g.setData("name", "root");
        g.setFontFamily(config.font.family);
        g.setFont(config.fontSize);
        g.textAlign("left");
        g.lineWidth(config.lineWidth);
        context.renderContents(root, g, config);
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
            constructor(parent, dx = 0, dy = 0) {
                super("g", {}, parent);
                this.attr = {};
                this.data = {};
                this.elideEmpty = true;
                this.attr.transform = `translate(${dx}, ${dy})`;
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
            group: function (dx, dy) {
                const node = new GroupElement(current, dx, dy);
                current.children.push(node);
                current = node;
            },
            ungroup: function () {
                if (current.parent)
                    current = current.parent;
            },
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
                current.attr["font-size"] = size + "px";
                weight && (current.attr["font-weight"] = weight);
                style && (current.attr["font-style"] = style);
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
            fillText: function (text, x, y, fill, dy) {
                const attr = { x, y, fill, stroke: fill };
                const anchor = getDefined(current, (e) => e.attr["text-align"]) === "center";
                anchor && (attr["text-anchor"] = "middle");
                dy && (attr["dy"] = dy);
                return el("text", attr, text);
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
        layout(root, config);
        render(root, g, config);
        return g.serialize();
    };

    class ParseError extends Error {
        constructor(source, expected, actual) {
            super(`Parser error at line ${source.from.line}: Expected ${expected} but got ${actual}`);
            this.source = source;
            this.expected = expected;
            this.actual = actual;
        }
    }
    const parse = (code) => {
        const statements = new Map();
        const pos = { ix: 0, line: 0, line_ix: 0 };
        const token_from = { ix: 0, line: 0, line_ix: 0 };
        const token_to = { ix: 0, line: 0, line_ix: 0 };
        const source = () => ({
            from: {
                line: token_from.line,
                col: token_from.ix - token_from.line_ix,
            },
            to: { line: token_to.line, col: token_to.ix - token_to.line_ix },
        });
        const error = (expected, actual) => {
            throw new ParseError(source(), expected, actual.length > 30 ? actual.substring(0, 40) + "..." : actual);
        };
        const notKeyword = (token, expected) => {
            if ([...Keywords].includes(token))
                error(expected, token);
        };
        const BLANKS = ["\t", " ", "\n"];
        const skipBlanksAndComments = () => {
            Object.assign(token_to, pos);
            while (pos.ix < code.length) {
                let char = code.charAt(pos.ix);
                if (char === "\n") {
                    pos.line++;
                    pos.line_ix = ++pos.ix;
                }
                else if (BLANKS.includes(char)) {
                    pos.ix++;
                }
                else if (char === "#") {
                    do {
                        pos.ix++;
                        char = code.charAt(pos.ix);
                    } while (pos.ix < code.length && char !== "\n");
                }
                else
                    break;
            }
        };
        const nextToken = () => {
            skipBlanksAndComments();
            let partial = "";
            let token = "";
            let char = "";
            Object.assign(token_from, pos);
            Object.assign(token_to, pos);
            while (pos.ix < code.length) {
                char = code.charAt(pos.ix);
                if ((char >= "a" && char <= "z") ||
                    (char >= "A" && char <= "Z") ||
                    (partial.length && char >= "0" && char <= "9")) {
                    partial += char;
                    token += char;
                    pos.ix++;
                }
                else if (![",", ...BLANKS].includes(char)) {
                    error("identifier", char);
                }
                else {
                    skipBlanksAndComments();
                    if (pos.ix < code.length) {
                        char = code.charAt(pos.ix);
                        if (char !== ",")
                            break;
                        partial = "";
                        token += char;
                        pos.ix++;
                        skipBlanksAndComments();
                    }
                }
            }
            return { token, source: source() };
        };
        const parseStatement = (type) => {
            const { token: name, source } = nextToken();
            !name && error("name", "nothing");
            name.indexOf(",") > 0 && error("name", "names");
            notKeyword(name, "name");
            !statements.has(name) &&
                statements.set(name, {
                    type: type.token,
                    source: type.source,
                    rels: new Map(),
                });
            const statement = statements.get(name);
            if (statement.type !== type.token)
                error(statement.type, type.token);
            statement.source.to = source.to;
            let next = nextToken();
            if (Types.includes(next.token))
                return next;
            const grammar = artifacts[type.token].grammar();
            while (next.token in grammar) {
                const rel = grammar[next.token];
                const { token: names, source } = nextToken();
                !names && error("names", "nothing");
                names.split(",").forEach((n) => notKeyword(n.trim(), "names"));
                names
                    .split(",")
                    .filter(Boolean)
                    .forEach((n) => statement?.rels.set(n, rel));
                statement.source.to = source.to;
                next = nextToken();
            }
            return next;
        };
        let next = nextToken();
        while (next.token.length) {
            if (Types.includes(next.token))
                next = parseStatement(next);
            else if (next.token.length)
                error("keyword", next.token);
        }
        return statements;
    };

    const FONTS = {
        monospace: { family: "Monospace", widthScale: 1.3, heightScale: 0.4 },
        inconsolata: { family: "Inconsolata", widthScale: 1.5, heightScale: 0.4 },
        caveat: { family: "Caveat", widthScale: 2.1, heightScale: 0.4 },
        handlee: { family: "Handlee", widthScale: 1.7, heightScale: 0.4 },
    };
    const DEFAULT_FONT = "inconsolata";
    const esml = (code, scale, font = DEFAULT_FONT) => {
        const config = {
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
            const root = compile(statements);
            return { svg: renderSvg(root, config) };
        }
        catch (error) {
            if (error instanceof ParseError)
                return { error };
            if (error instanceof CompilerError)
                return { error };
            if (error instanceof Error) {
                const message = error.stack.split("\n").slice(0, 2).join(" ");
                return { error: Error(message) };
            }
            return { error: Error(error) };
        }
    };

    const MIN_X = 0, MIN_Y = 0;
    class Canvas extends EventEmitter {
        constructor(document, container, options) {
            super();
            this.SCALE = 80;
            this.WIDTH = this.SCALE * 100;
            this.HEIGHT = this.SCALE * 100;
            this.dragging = false;
            this.dx = 0;
            this.dy = 0;
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
            container.addEventListener("wheel", (e) => {
                e.preventDefault();
                if (e.metaKey || e.ctrlKey) {
                    this.fitZoom(this.zoom + e.deltaY * -0.01);
                    this.transform();
                }
                else {
                    this.transform(e.deltaX, e.deltaY);
                }
            });
            const dragStart = ({ clientX, clientY }) => {
                this.dragging = true;
                this.dx = clientX;
                this.dy = clientY;
                container.style.cursor = "grabbing";
            };
            const dragEnd = () => {
                this.dragging = false;
                container.style.cursor = "default";
            };
            const drag = ({ clientX, clientY }) => {
                if (this.dragging) {
                    this.transform(this.dx - clientX, this.dy - clientY);
                    this.dx = clientX;
                    this.dy = clientY;
                }
            };
            container.addEventListener("mousedown", dragStart);
            container.addEventListener("mouseup", dragEnd);
            container.addEventListener("mousemove", drag);
            container.addEventListener("touchstart", (e) => dragStart(e.touches[0]));
            container.addEventListener("touchend", dragEnd);
            container.addEventListener("touchmove", (e) => drag(e.touches[0]));
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
                this.emit("transformed", { x: this.x, y: this.y, zoom: this.zoom });
            }
        }
        render(state) {
            const { error, svg } = esml(state.code, this.SCALE, state.font);
            if (error)
                return error;
            this.svg.innerHTML = svg;
            const root = this.svg.firstElementChild;
            const rootBox = root?.getBoundingClientRect();
            this.w = Math.floor(rootBox?.width);
            this.h = Math.floor(rootBox?.height);
            if (state.zoom) {
                this.x = state.x || 0;
                this.y = state.y || 0;
                this.zoom = state.zoom;
            }
            this.transform();
        }
    }

    exports.Canvas = Canvas;
    exports.EventEmitter = EventEmitter;
    exports.Keywords = Keywords;
    exports.debounce = debounce;
    exports.esml = esml;

}));
