"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isContextNode = exports.COLORS = exports.Keywords = exports.ArtTypes = void 0;
exports.ArtTypes = [
    "context",
    "actor",
    "aggregate",
    "system",
    "projector",
    "policy",
    "process",
];
const Messages = ["command", "event"];
const Visuals = [...exports.ArtTypes, ...Messages];
const Actions = ["invokes", "handles", "emits", "includes", "reads"];
exports.Keywords = [...exports.ArtTypes, ...Actions];
exports.COLORS = {
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
const isContextNode = (node) => "nodes" in node;
exports.isContextNode = isContextNode;
//# sourceMappingURL=types.js.map