import { esml } from "./esml";
import { ParseError } from "./parser";
import { EventEmitter } from "./utils";

const MIN_X = 0,
  MIN_Y = 0;

type Options = {
  SCALE: number;
  WIDTH: number;
  HEIGHT: number;
  coordsSpan?: HTMLSpanElement;
  zoomSpan?: HTMLSpanElement;
  fitBtn?: HTMLButtonElement;
};

type State = {
  code: string;
  x?: number;
  y?: number;
  zoom?: number;
  svg?: string;
};

export declare interface Canvas {
  on(event: "transformed", listener: (args: State) => void): this;
}

export class Canvas extends EventEmitter {
  readonly SCALE: number = 80;
  readonly WIDTH = this.SCALE * 100;
  readonly HEIGHT = this.SCALE * 100;
  readonly svg: Element;
  readonly coordsSpan: HTMLSpanElement | undefined;
  readonly zoomSpan: HTMLSpanElement | undefined;
  readonly fitBtn: HTMLButtonElement | undefined;

  zoom = 1;
  x = 0;
  y = 0;
  w = 0;
  h = 0;

  constructor(
    document: Document,
    container: HTMLDivElement,
    options?: Options
  ) {
    super();
    if (options) {
      this.SCALE = options.SCALE;
      this.WIDTH = options.WIDTH;
      this.HEIGHT = options.HEIGHT;
      this.coordsSpan = options.coordsSpan;
      this.zoomSpan = options.zoomSpan;
      this.fitBtn = options.fitBtn;
    }
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttributeNS(
      "http://www.w3.org/2000/xmlns/",
      "xmlns:xlink",
      "http://www.w3.org/1999/xlink"
    );
    this.svg.setAttribute(
      "viewBox",
      `${MIN_X} ${MIN_Y} ${this.WIDTH} ${this.HEIGHT}`
    );
    this.svg.setAttribute("width", `${this.WIDTH}`);
    this.svg.setAttribute("height", `${this.HEIGHT}`);
    container.appendChild(this.svg);

    container.addEventListener("wheel", (event: WheelEvent) => {
      event.preventDefault();
      if (event.metaKey || event.ctrlKey) {
        this.fitZoom(this.zoom + event.deltaY * -0.01);
        this.transform();
      } else {
        this.transform(event.deltaX, event.deltaY);
      }
    });

    this.fitBtn &&
      (this.fitBtn.onclick = () => {
        const vw = container.clientWidth;
        const vh = container.clientHeight;
        this.fitZoom(Math.min(vw / this.w, vh / this.h));
        this.x = Math.floor((vw - this.w * this.zoom) / 2);
        this.y = Math.floor((vh - this.h * this.zoom) / 2);
        this.transform();
      });
  }

  private fitZoom(z: number) {
    this.zoom = Math.round(Math.min(Math.max(0.1, z), 3) * 100) / 100;
  }

  private transform(dx = 0, dy = 0) {
    const g = this.svg.children[0];
    if (g) {
      this.x = Math.floor(
        Math.min(Math.max(this.x - dx, MIN_X - this.w * this.zoom), this.WIDTH)
      );
      this.y = Math.floor(
        Math.min(Math.max(this.y - dy, MIN_Y - this.h * this.zoom), this.HEIGHT)
      );
      this.coordsSpan &&
        (this.coordsSpan.innerText = `x:${this.x} y:${this.y} w:${this.w} h:${this.h}`);
      this.zoomSpan &&
        (this.zoomSpan.innerText = `${Math.floor(this.zoom * 100)}%`);
      g.setAttribute(
        "transform",
        `translate(${this.x}, ${this.y}) scale(${this.zoom})`
      );
      this.emit("transformed", {
        x: this.x,
        y: this.y,
        zoom: this.zoom,
      } as State);
    }
  }

  public render({ code, x, y, zoom }: State): ParseError | undefined {
    const { error, svg, width, height } = esml(code, this.SCALE);
    if (error) return error;
    this.w = width!;
    this.h = height!;
    this.svg.innerHTML = svg!;
    if (x && y && zoom) {
      this.x = x;
      this.y = y;
      this.zoom = zoom;
    }
    this.transform();
  }
}
