"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Actor = void 0;
exports.Actor = {
    grammar: {
        invokes: { visual: "command", owns: false },
        reads: { visual: "projector", owns: false },
    },
    rel: (source, target) => target.visual === "command"
        ? { source: target, target: source }
        : { source, target },
};
//# sourceMappingURL=Actor.js.map