import { esml, Node } from "./esml";
import { EventEmitter } from "./utils";

const MIN_X = 0,
  MIN_Y = 0;

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

export class Canvas extends EventEmitter {
  readonly SCALE: number = 80;
  readonly WIDTH = this.SCALE * 100;
  readonly HEIGHT = this.SCALE * 100;
  readonly tooltip: HTMLDivElement;
  readonly svg: Element;
  readonly coordsSpan: HTMLSpanElement | undefined;
  readonly zoomBtn: HTMLButtonElement | undefined;
  readonly zoomInBtn: HTMLButtonElement | undefined;
  readonly zoomOutBtn: HTMLButtonElement | undefined;

  private nodes?: HTMLDivElement;

  private dragging = false;
  private dx = 0;
  private dy = 0;

  private zoom = 1;
  private x = 0;
  private y = 0;
  private w = 0;
  private h = 0;

  constructor(
    private document: Document,
    private container: HTMLDivElement,
    options?: Options
  ) {
    super();
    this.tooltip = document.createElement("div");
    this.tooltip.className = "node-tooltip";
    this.container.appendChild(this.tooltip);

    if (options) {
      this.SCALE = options.SCALE;
      this.WIDTH = options.WIDTH;
      this.HEIGHT = options.HEIGHT;
      this.coordsSpan = options.coordsSpan;
      this.zoomBtn = options.zoomBtn;
      this.zoomInBtn = options.zoomInBtn;
      this.zoomOutBtn = options.zoomOutBtn;
    }
    this.svg = this.document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
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
    this.container.appendChild(this.svg);

    this.container.addEventListener("wheel", (e: WheelEvent) => {
      e.preventDefault();
      if (e.metaKey || e.ctrlKey) {
        this.fitZoom(this.zoom + e.deltaY * -0.01);
        this.transform();
      } else {
        this.transform(e.deltaX, e.deltaY);
      }
    });

    type Pos = { clientX: number; clientY: number };
    const dragStart = ({ clientX, clientY }: Pos) => {
      this.dragging = true;
      this.dx = clientX;
      this.dy = clientY;
      this.container.style.cursor = "grabbing";
    };

    const dragEnd = () => {
      this.dragging = false;
      this.container.style.cursor = "default";
    };

    const drag = ({ clientX, clientY }: Pos) => {
      if (this.dragging) {
        this.transform(this.dx - clientX, this.dy - clientY);
        this.dx = clientX;
        this.dy = clientY;
      }
    };

    this.container.addEventListener("mousedown", dragStart);
    this.container.addEventListener("mouseup", dragEnd);
    this.container.addEventListener("mousemove", drag);
    this.container.addEventListener("touchstart", (e) =>
      dragStart(e.touches[0])
    );
    this.container.addEventListener("touchend", dragEnd);
    this.container.addEventListener("touchmove", (e) => drag(e.touches[0]));

    this.zoomBtn &&
      (this.zoomBtn.onclick = () => this.fitToContainer.apply(this));
    this.zoomInBtn &&
      (this.zoomInBtn.onclick = () => this.zoomTo.apply(this, [0.1]));
    this.zoomOutBtn &&
      (this.zoomOutBtn.onclick = () => this.zoomTo.apply(this, [-0.1]));
  }

  public fitToContainer() {
    const vw = Math.min(this.container.clientWidth, window.innerWidth);
    const vh = Math.min(this.container.clientHeight, window.innerHeight);
    if (this.w && this.h && vw && vh) {
      // avoid NaN
      this.fitZoom(Math.min(vw / this.w, vh / this.h));
      this.x = Math.floor((vw - this.w * this.zoom) / 2);
      this.y = Math.floor((vh - this.h * this.zoom) / 2);
      this.transform();
    }
  }

  private zoomTo(z: number) {
    this.fitZoom(this.zoom + z);
    this.transform();
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
      this.zoomBtn &&
        (this.zoomBtn.innerText = `${Math.floor(this.zoom * 100)}%`);
      g.setAttribute(
        "transform",
        `translate(${this.x}, ${this.y}) scale(${this.zoom})`
      );
      this.emit("transformed", { x: this.x, y: this.y, zoom: this.zoom });
    }
  }

  private addNodes(nodes?: Node[]) {
    const handleMouseEnter = (event: MouseEvent) => {
      const g = event.target as SVGGElement;
      const name = g.dataset.name;
      const node = this.document.getElementById("node-" + name);
      if (node) {
        this.tooltip.innerHTML = node?.innerHTML;
        this.tooltip.className = "node-tooltip-visible";
        //const { left, top, width } = g.getBoundingClientRect();
        const x = event.x; // left + (width - this.tooltip.offsetWidth) / 2;
        const y = event.y; // top - this.tooltip.offsetHeight;
        this.tooltip.style.left = x + "px";
        this.tooltip.style.top = y + "px";
      }
    };
    const handleMouseLeave = () => {
      this.tooltip.className = "node-tooltip";
      this.tooltip.innerText = "";
    };
    this.nodes && this.container.removeChild(this.nodes);
    this.nodes = this.document.createElement("div");
    this.container.appendChild(this.nodes);
    this.nodes.style.visibility = "hidden";
    nodes &&
      nodes
        .filter((node) => node.fields.length || node.description)
        .map((node) => {
          const el = this.document.createElement("div");
          el.id = "node-" + node.id;
          el.innerHTML = `<div class="name">${node.id}</div>
        <div class="description">${node.description || ""}</div>
        <table class="table table-sm">
          ${node.fields
            .slice(0, 20)
            .map((f) => {
              const name =
                f.name.length > 10 ? f.name.substring(0, 10) + "..." : f.name;
              const tel = f.required ? "th" : "td";
              return `<tr><${tel}>${name}</${tel}><td>${f.type}</td></tr>`;
            })
            .join("")}
            ${
              node.fields.length > 20 ? "<tr><td colspan='2'>...</td></tr>" : ""
            }
        </table>
        `;
          this.nodes?.appendChild(el);
          const g = this.document.getElementById("g-" + node.id);
          if (g) {
            g.addEventListener("mouseenter", handleMouseEnter);
            g.addEventListener("mouseleave", handleMouseLeave);
          }
        });
  }

  public render(state: State): Error | undefined {
    const { error, svg, width, height, nodes } = esml(
      state.code,
      this.SCALE,
      state.font
    );
    if (error) return error;
    this.svg.innerHTML = svg!;
    this.addNodes(nodes);
    this.w = Math.floor(width!);
    this.h = Math.floor(height!);
    if (state.zoom) {
      this.x = state.x || 0;
      this.y = state.y || 0;
      this.zoom = state.zoom;
    }
    this.transform();
  }
}
