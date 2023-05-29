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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.artifacts = void 0;
const Actor_1 = require("./Actor");
const Context_1 = require("./Context");
const Policy_1 = require("./Policy");
const Projector_1 = require("./Projector");
const System_1 = require("./System");
exports.artifacts = {
    context: Context_1.Context,
    actor: Actor_1.Actor,
    aggregate: System_1.System,
    system: System_1.System,
    policy: Policy_1.Policy,
    process: Policy_1.Policy,
    projector: Projector_1.Projector,
};
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map