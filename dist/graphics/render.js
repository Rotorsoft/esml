"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.render = void 0;
const artifacts_1 = require("../artifacts");
const utils_1 = require("../utils");
const SvgGraphics_1 = require("./SvgGraphics");
const CTX_STROKE = "#aaaaaa";
const NOTE_STROKE = "#555555";
const ARROW_SIZE = 1.5;
const pickFontSize = (words, w) => {
    const max = words
        .map((word) => word.length)
        .sort((a, b) => b - a)
        .at(0);
    return Math.floor(Math.min(Math.max(Math.ceil(w / max), 8), 24));
};
const sizeText = (text, w, h) => {
    let fontSize = pickFontSize(text, w);
    while (fontSize > 5) {
        const maxWidth = Math.ceil(w / fontSize) - 1;
        const maxHeight = Math.floor(h / fontSize) - 1;
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
        lines: [text.join(" ")],
        fontSize,
    };
};
const renderText = (text, w, h, g, options = { fit: true }) => {
    const width = options.w || w || 0;
    const height = options.h || h || 0;
    const { lines, fontSize } = options.fit
        ? sizeText(text, width, height)
        : {
            lines: text,
            fontSize: options.fontSize || 12,
        };
    g.attr("font-size", fontSize + "pt");
    const x = options.x || Math.floor(width / 2);
    const y = options.y || Math.floor(height / 2);
    const m = Math.floor(lines.length / 2);
    const o = lines.length % 2 ? 0.3 : 0.9;
    lines.forEach((line, i) => {
        g.text(line, x, y, {
            fill: NOTE_STROKE,
            dy: `${((i - m) * 1.2 + o).toFixed(2)}em`,
        });
    });
};
const getPath = (edge) => {
    if (edge.path) {
        const path = edge.path.slice(1, -1);
        const endDir = (0, utils_1.normalize)((0, utils_1.difference)(path[path.length - 2], path.at(-1)));
        const end = path.length - 1;
        const copy = path.map((p) => ({ x: p.x, y: p.y }));
        copy[end] = (0, utils_1.add)(copy[end], (0, utils_1.multiply)(endDir, ARROW_SIZE * (edge.arrow ? 5 : 0)));
        return copy;
    }
    const x1 = edge.source.x + edge.source.width / 2;
    const x2 = edge.target.x - edge.target.width / 2;
    const y1 = edge.source.y;
    const y2 = edge.target.y;
    if (y1 === y2)
        return [{ x: x1, y: y1 }, { dx: x2 - x1 }];
    const dx = Math.floor((x2 - x1) / 2);
    const dy = Math.floor(y2 - y1);
    return [{ x: x1, y: y1 }, { dx }, { dy }, { dx }];
};
const renderEdge = (edge, g) => {
    const attrs = {
        fill: "none",
        stroke: edge.arrow ? edge.color : edge.target.color,
    };
    edge.arrow && (attrs["stroke-width"] = 3);
    g.path(getPath(edge), false, { ...attrs });
    if (edge.arrow) {
        const end = edge.path[edge.path.length - 2];
        const path = edge.path.slice(1, -1);
        const dir = (0, utils_1.normalize)((0, utils_1.difference)(path[path.length - 2], path.at(-1)));
        const x = (s) => (0, utils_1.add)(end, (0, utils_1.multiply)(dir, s * ARROW_SIZE));
        const y = (s) => (0, utils_1.multiply)((0, utils_1.rotate)(dir), s * ARROW_SIZE);
        g.path([(0, utils_1.add)(x(10), y(4)), x(5), (0, utils_1.add)(x(10), y(-4)), end], true, {
            ...attrs,
            fill: edge.color,
        });
    }
};
const renderSimpleRef = (target, x, y, w, h, g) => {
    g.group("").attr("fill", target.color);
    g.rect(x, y, w, h);
    renderText((0, utils_1.splitId)(target.id), w, h, g, {
        fit: true,
        x: x + w / 2,
        y: y + h / 2,
        w,
        h,
    });
    g.ungroup();
};
const renderRef = (ctx, target, x, y, w, h, g) => {
    renderSimpleRef(target, x, y, w, h, g);
    const actorRefs = ctx.actors?.refs.get(target.id);
    const hw = Math.ceil(w / 2);
    const hh = Math.ceil(h / 2);
    actorRefs &&
        [...actorRefs].forEach((target, i) => renderSimpleRef(target, x - hw + 4, y + i * (hh + 2) - 4, hw, hh, g));
};
const renderMultilineRef = (targets, x, y, w, h, g) => {
    const text = targets.map((target) => `- ${(0, utils_1.splitId)(target.id).join(" ")}`);
    g.group("")
        .attr("fill", targets[0].color)
        .attr("text-align", "left")
        .attr("text-anchor", "start");
    g.rect(x, y, w, h);
    renderText(text, w, h, g, {
        fit: true,
        x: x + 4,
        y: y + h / 2,
        w,
        h,
    });
    g.ungroup();
};
const renderCommandRefs = (ctx, targets, x, y, w, h, g) => {
    const th = Math.floor(h / targets.length);
    targets.forEach((target, i) => renderRef(ctx, target, x, y + i * (th + 2), w, th, g));
};
const renderRefs = (ctx, g, style) => {
    ctx.refs.forEach((targets, sourceId) => {
        const source = ctx.nodes.get(sourceId);
        const x = Math.floor(source.x - source.width / 2 - style.scale * 0.2);
        const y = Math.floor(source.y + source.height * 0.4);
        const w = Math.floor(style.scale);
        const h = Math.floor(style.scale / 2);
        targets.size > 1
            ? source.visual === "command"
                ? renderCommandRefs(ctx, [...targets], x, y, w, h, g)
                : renderMultilineRef([...targets], x, y, w, h, g)
            : renderRef(ctx, [...targets][0], x, y, w, h, g);
    });
};
const context = (ctx, g, style) => {
    if ((0, artifacts_1.isContextNode)(ctx)) {
        if (ctx.id) {
            const words = (0, utils_1.splitId)(ctx.id);
            g.text(words.join(" "), 0, 0, {
                fill: CTX_STROKE,
                stroke: CTX_STROKE,
                dy: -style.fontSize,
            });
            g.rect(0, 0, ctx.width, ctx.height, { rx: 25, ry: 25 });
        }
        g.group("", { dx: style.padding, dy: style.padding });
        if (ctx.id)
            g.attr("text-align", "center")
                .attr("text-anchor", "middle")
                .attr("stroke", NOTE_STROKE);
        ctx.edges.forEach((e) => e.color && renderEdge({ ...e, source: ctx.nodes.get(e.source.id) }, g));
        ctx.nodes.forEach((n) => n.color && renderNode(n, g, style));
        renderRefs(ctx, g, style);
        g.ungroup();
    }
};
const note = (node, g) => {
    g.attr("fill", node.color);
    g.rect(0, 0, node.width, node.height);
    renderText((0, utils_1.splitId)(node.id), node.width, node.height, g);
    node.schema &&
        g.text(`{${node.schema.size}}`, node.width - 6, 6, {
            "font-family": "monospace",
            "font-size": "6pt",
            fill: NOTE_STROKE,
        });
};
const renderNode = (node, g, style) => {
    const dx = Math.floor(node.x - node.width / 2);
    const dy = Math.floor(node.y - node.height / 2);
    const render = node.visual === "context" ? context : note;
    g.group(node.id, { class: node.visual, dx, dy });
    render(node, g, style);
    g.ungroup();
};
const render = (root, style) => {
    const g = new SvgGraphics_1.SvgGraphics({
        fill: style.fill,
        "font-family": style.font,
        "font-size": style.fontSize + "pt",
        "text-align": "left",
        stroke: style.stroke,
        "stroke-width": 1,
    });
    context(root, g, style);
    return g.serialize();
};
exports.render = render;
//# sourceMappingURL=render.js.map