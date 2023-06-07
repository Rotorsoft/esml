"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Projector = void 0;
const types_1 = require("./types");
exports.Projector = {
    grammar: { handles: { type: "event" } },
    rel: (source, target) => ({
        source: source.ctx === target.ctx ? target : { ...target, id: target.id + "*" },
        target: source,
        edge: true,
        color: types_1.COLORS.event,
        arrow: false,
    }),
};
//# sourceMappingURL=Projector.js.map