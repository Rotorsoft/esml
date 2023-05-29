"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventEmitter = exports.debounce = exports.splitId = exports.pad = exports.rotate = exports.normalize = exports.multiply = exports.add = exports.distance = exports.difference = exports.magnitude = void 0;
const magnitude = (v) => Math.sqrt(v.x * v.x + v.y * v.y);
exports.magnitude = magnitude;
const difference = (a, b) => ({
    x: a.x - b.x,
    y: a.y - b.y,
});
exports.difference = difference;
const distance = (a, b) => (0, exports.magnitude)((0, exports.difference)(a, b));
exports.distance = distance;
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
exports.add = add;
const multiply = (v, factor) => ({
    x: factor * v.x,
    y: factor * v.y,
});
exports.multiply = multiply;
const normalize = (v) => (0, exports.multiply)(v, 1 / (0, exports.magnitude)(v));
exports.normalize = normalize;
const rotate = (a) => ({ x: a.y, y: -a.x });
exports.rotate = rotate;
const pad = (n, l) => n.toString().padStart(l);
exports.pad = pad;
const splitId = (text) => text.trim().split(/(?=[A-Z])/);
exports.splitId = splitId;
const debounce = (func, delay) => {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};
exports.debounce = debounce;
class EventEmitter {
    constructor() {
        this.listeners = new Map();
    }
    on(eventName, listener) {
        !this.listeners.has(eventName) && this.listeners.set(eventName, new Set());
        this.listeners.get(eventName).add(listener);
    }
    emit(eventName, ...args) {
        this.listeners.has(eventName) &&
            this.listeners.get(eventName).forEach((listener) => listener(...args));
    }
}
exports.EventEmitter = EventEmitter;
//# sourceMappingURL=utils.js.map