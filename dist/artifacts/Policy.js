"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Policy = void 0;
const types_1 = require("./types");
exports.Policy = {
    grammar: {
        handles: { type: "event" },
        invokes: { type: "command" },
        reads: { type: "projector" },
    },
    rel: (source, target) => target.visual === "event"
        ? {
            source: source.ctx === target.ctx
                ? target
                : { ...target, id: target.id + "*" },
            target: source,
            edge: true,
            color: types_1.COLORS.event,
            arrow: false,
        }
        : target.visual === "projector"
            ? { source, target }
            : source.ctx === target.ctx
                ? {
                    source,
                    target,
                    edge: true,
                    color: types_1.COLORS.command,
                    arrow: false,
                }
                : { source: target, target: source },
};
//# sourceMappingURL=Policy.js.map