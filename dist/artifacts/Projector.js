"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Projector = void 0;
const types_1 = require("./types");
exports.Projector = {
    grammar: { handles: { visual: "event", owns: false } },
    rel: (source, target) => ({
        source: target,
        target: source,
        edge: true,
        color: types_1.COLORS.event,
        arrow: false,
    }),
};
//# sourceMappingURL=Projector.js.map