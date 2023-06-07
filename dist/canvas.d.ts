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
    readonly tooltip: HTMLDivElement;
    readonly svg: Element;
    readonly coordsSpan: HTMLSpanElement | undefined;
    readonly zoomBtn: HTMLButtonElement | undefined;
    readonly zoomInBtn: HTMLButtonElement | undefined;
    readonly zoomOutBtn: HTMLButtonElement | undefined;
    private nodes?;
    private dragging;
    private dx;
    private dy;
    private zoom;
    private x;
    private y;
    private w;
    private h;
    constructor(document: Document, container: HTMLDivElement, options?: Options);
    fitToContainer(): void;
    private zoomTo;
    private fitZoom;
    private transform;
    private addNodes;
    render(state: State): Error | undefined;
}
export {};
//# sourceMappingURL=canvas.d.ts.map