"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.layout = void 0;
const dagre = __importStar(require("dagre"));
const utils_1 = require("../utils");
const square = (node, style) => {
    node.x = 0;
    node.y = 0;
    node.width = style.scale;
    node.height = style.scale;
};
const rectangle = (node, style) => {
    node.x = 0;
    node.y = 0;
    node.width = style.scale * 2;
    node.height = style.scale;
};
const layout = (root, style) => {
    function layouter(visual) {
        switch (visual) {
            case "context":
                return layoutContext;
            case "command":
            case "event":
                return square;
            default:
                return rectangle;
        }
    }
    const PAD = 2 * style.padding;
    const layoutContext = (ctx, style) => {
        if (ctx.nodes.size) {
            const graph = new dagre.graphlib.Graph({
                multigraph: true,
            });
            graph.setGraph({
                nodesep: style.margin,
                edgesep: style.margin,
                ranksep: style.margin,
                acyclicer: ctx.id && "greedy",
                rankdir: "LR",
                ranker: "network-simplex",
            });
            ctx.nodes.forEach((n) => n.color && layouter(n.visual)(n, style));
            ctx.nodes.forEach(({ id, width, height }) => width && height && graph.setNode(id, { width, height }));
            ctx.edges.forEach(({ source, target }, id) => graph.setEdge(source.id, target.id, {}, id));
            dagre.layout(graph);
            ctx.nodes.forEach((n) => {
                const gn = graph.node(n.id);
                if (gn) {
                    n.x = gn.x;
                    n.y = gn.y;
                }
            });
            !ctx.id &&
                graph.edges().forEach((e) => {
                    const ge = graph.edge(e);
                    const ne = ctx.edges.get(e.name);
                    ne.path = [ne.source, ...ge.points, ne.target].map((n) => ({
                        x: Math.floor(n.x),
                        y: Math.floor(n.y),
                    }));
                });
            const { width = 0, height = 0 } = graph.graph();
            ctx.width = width + PAD;
            ctx.height = height + PAD;
        }
        else {
            ctx.width = (0, utils_1.splitId)(ctx.id).join(" ").length * style.fontSize + PAD;
            ctx.height = style.fontSize + PAD;
        }
    };
    return layoutContext(root, style);
};
exports.layout = layout;
//# sourceMappingURL=layout.js.map