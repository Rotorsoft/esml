import { EventEmitter } from "./utils";
type Options = {
    SCALE: number;
    WIDTH: number;
    HEIGHT: number;
    coordsSpan?: HTMLSpanElement;
    zoomBtn?: HTMLButtonElement;
    zoomInBtn?: HTMLButtonElement;
    zoomOutBtn?: HTMLButtonElement;
};
type State = {
    code: string;
    font: string;
    x?: number;
    y?: number;
    zoom?: number;
};
export declare interface Canvas {
    on(event: "transformed", listener: (args: State) => void): this;
}
export declare class Canvas extends EventEmitter {
    private document;
    private container;
    readonly SCALE: number;
    readonly WIDTH: number;
    readonly HEIGHT: number;
    readonly svg: Element;
    readonly coordsSpan: HTMLSpanElement | undefined;
    readonly zoomBtn: HTMLButtonElement | undefined;
    readonly zoomInBtn: HTMLButtonElement | undefined;
    readonly zoomOutBtn: HTMLButtonElement | undefined;
    dragging: boolean;
    dx: number;
    dy: number;
    zoom: number;
    x: number;
    y: number;
    w: number;
    h: number;
    constructor(document: Document, container: HTMLDivElement, options?: Options);
    fitToContainer(): void;
    private zoomTo;
    private fitZoom;
    private transform;
    render(state: State): Error | undefined;
}
export {};
//# sourceMappingURL=canvas.d.ts.map