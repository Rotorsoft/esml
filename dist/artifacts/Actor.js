"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Actor = void 0;
exports.Actor = {
    grammar: {
        invokes: { type: "command" },
        reads: { type: "projector" },
    },
    rel: (source, target) => target.visual === "command"
        ? { source: target, target: source }
        : { source, target },
};
//# sourceMappingURL=Actor.js.map