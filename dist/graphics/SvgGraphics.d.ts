import { Graphics, Path, SvgAttr, SvgAttrs } from "./types";
export declare class SvgGraphics implements Graphics {
    private readonly root;
    private current;
    private _new;
    constructor(attrs: SvgAttrs);
    group(name: string, attrs?: {
        class?: string;
        dx?: number;
        dy?: number;
    }): this;
    ungroup(): void;
    attr<K extends keyof SvgAttr>(key: K, val: SvgAttrs[K]): this;
    rect(x: number, y: number, width: number, height: number, attrs?: {
        fill?: string;
        stroke?: string;
        style?: string;
        rx?: number;
        ry?: number;
    }): void;
    path(path: Path[], close?: boolean, attrs?: SvgAttrs): void;
    text(text: string, x: number, y: number, attrs?: {
        fill?: string;
        stroke?: string;
        dy?: number | string;
    }): void;
    serialize(): string;
}
//# sourceMappingURL=SvgGraphics.d.ts.map