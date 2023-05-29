"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = void 0;
const types_1 = require("./types");
exports.Context = {
    grammar: {
        includes: { visual: "artifact", owns: true },
    },
    // resolves inter-context relationships
    rel: (source, target, root) => {
        if (target.visual === "event")
            return {
                source: root.nodes.get(target.ctx),
                target: root.nodes.get(source.ctx),
                edge: true,
                color: types_1.COLORS.event,
                arrow: true,
            };
        if (target.visual === "command")
            return {
                source: root.nodes.get(source.ctx),
                target: root.nodes.get(target.ctx),
                edge: true,
                color: types_1.COLORS.command,
                arrow: true,
            };
        if (target.visual === "projector")
            return {
                source: root.nodes.get(source.ctx),
                target: root.nodes.get(target.ctx),
                edge: true,
                color: types_1.COLORS.projector,
                arrow: true,
            };
    },
};
//# sourceMappingURL=Context.js.map