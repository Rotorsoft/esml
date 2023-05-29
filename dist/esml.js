"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.esml = void 0;
const compiler_1 = require("./compiler");
const graphics_1 = require("./graphics");
const parser_1 = require("./parser");
const FONTS = {
    monospace: "Monospace",
    inconsolata: "Inconsolata",
    caveat: "Caveat",
    handlee: "Handlee",
};
const DEFAULT_FONT = "inconsolata";
const esml = (code, scale, font = DEFAULT_FONT) => {
    const style = {
        scale,
        stroke: "#dedede",
        fill: "white",
        font: FONTS[font.toLowerCase()] || FONTS[DEFAULT_FONT],
        fontSize: 12,
        padding: 30,
        margin: 40,
    };
    try {
        const statements = (0, parser_1.parse)(code);
        const root = (0, compiler_1.compile)(statements);
        (0, graphics_1.layout)(root, style);
        const svg = (0, graphics_1.render)(root, style);
        return { svg, width: root.width, height: root.height };
    }
    catch (error) {
        if (error instanceof parser_1.ParseError)
            return { error };
        if (error instanceof compiler_1.CompilerError)
            return { error };
        if (error instanceof Error) {
            const message = error.stack.split("\n").slice(0, 2).join(" ");
            return { error: Error(message) };
        }
        return { error: Error(error) };
    }
};
exports.esml = esml;
//# sourceMappingURL=esml.js.map