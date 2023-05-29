"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.System = void 0;
exports.System = {
    grammar: {
        handles: { visual: "command", owns: true },
        emits: { visual: "event", owns: true },
    },
    rel: (source, target) => target.visual === "command"
        ? { source: target, target: source, edge: true }
        : { source, target, edge: true },
};
//# sourceMappingURL=System.js.map