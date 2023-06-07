"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Canvas = void 0;
const esml_1 = require("./esml");
const utils_1 = require("./utils");
const MIN_X = 0, MIN_Y = 0;
class Canvas extends utils_1.EventEmitter {
    constructor(document, container, options) {
        super();
        this.document = document;
        this.container = container;
        this.SCALE = 80;
        this.WIDTH = this.SCALE * 100;
        this.HEIGHT = this.SCALE * 100;
        this.dragging = false;
        this.dx = 0;
        this.dy = 0;
        this.zoom = 1;
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
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
        this.svg = this.document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        this.svg.setAttribute("viewBox", `${MIN_X} ${MIN_Y} ${this.WIDTH} ${this.HEIGHT}`);
        this.svg.setAttribute("width", `${this.WIDTH}`);
        this.svg.setAttribute("height", `${this.HEIGHT}`);
        this.container.appendChild(this.svg);
        this.container.addEventListener("wheel", (e) => {
            e.preventDefault();
            if (e.metaKey || e.ctrlKey) {
                this.fitZoom(this.zoom + e.deltaY * -0.01);
                this.transform();
            }
            else {
                this.transform(e.deltaX, e.deltaY);
            }
        });
        const dragStart = ({ clientX, clientY }) => {
            this.dragging = true;
            this.dx = clientX;
            this.dy = clientY;
            this.container.style.cursor = "grabbing";
        };
        const dragEnd = () => {
            this.dragging = false;
            this.container.style.cursor = "default";
        };
        const drag = ({ clientX, clientY }) => {
            if (this.dragging) {
                this.transform(this.dx - clientX, this.dy - clientY);
                this.dx = clientX;
                this.dy = clientY;
            }
        };
        this.container.addEventListener("mousedown", dragStart);
        this.container.addEventListener("mouseup", dragEnd);
        this.container.addEventListener("mousemove", drag);
        this.container.addEventListener("touchstart", (e) => dragStart(e.touches[0]));
        this.container.addEventListener("touchend", dragEnd);
        this.container.addEventListener("touchmove", (e) => drag(e.touches[0]));
        this.zoomBtn &&
            (this.zoomBtn.onclick = () => this.fitToContainer.apply(this));
        this.zoomInBtn &&
            (this.zoomInBtn.onclick = () => this.zoomTo.apply(this, [0.1]));
        this.zoomOutBtn &&
            (this.zoomOutBtn.onclick = () => this.zoomTo.apply(this, [-0.1]));
    }
    fitToContainer() {
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
    zoomTo(z) {
        this.fitZoom(this.zoom + z);
        this.transform();
    }
    fitZoom(z) {
        this.zoom = Math.round(Math.min(Math.max(0.1, z), 3) * 100) / 100;
    }
    transform(dx = 0, dy = 0) {
        const g = this.svg.children[0];
        if (g) {
            this.x = Math.floor(Math.min(Math.max(this.x - dx, MIN_X - this.w * this.zoom), this.WIDTH));
            this.y = Math.floor(Math.min(Math.max(this.y - dy, MIN_Y - this.h * this.zoom), this.HEIGHT));
            this.coordsSpan &&
                (this.coordsSpan.innerText = `x:${this.x} y:${this.y} w:${this.w} h:${this.h}`);
            this.zoomBtn &&
                (this.zoomBtn.innerText = `${Math.floor(this.zoom * 100)}%`);
            g.setAttribute("transform", `translate(${this.x}, ${this.y}) scale(${this.zoom})`);
            this.emit("transformed", { x: this.x, y: this.y, zoom: this.zoom });
        }
    }
    addNodes(nodes) {
        const handleMouseEnter = (event) => {
            const g = event.target;
            const name = g.dataset.name;
            const node = this.document.getElementById("node-" + name);
            if (node) {
                this.tooltip.innerHTML = node?.innerHTML;
                this.tooltip.className = "node-tooltip-visible";
                const { left, top, width } = g.getBoundingClientRect();
                const x = left + (width - this.tooltip.offsetWidth) / 2;
                const y = top - this.tooltip.offsetHeight;
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
                .filter((node) => node.fields.length)
                .map((node) => {
                const el = this.document.createElement("div");
                el.id = "node-" + node.id;
                el.innerHTML = `<h6>${node.id}</h6>
        <table class="table table-sm">
          ${node.fields
                    .slice(0, 20)
                    .map((f) => {
                    const name = f.name.length > 10 ? f.name.substring(0, 10) + "..." : f.name;
                    const tel = f.required ? "th" : "td";
                    return `<tr><${tel}>${name}</${tel}><td>${f.type}</td></tr>`;
                })
                    .join("")}
            ${node.fields.length > 20 ? "<tr><td colspan='2'>...</td></tr>" : ""}
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
    render(state) {
        const { error, svg, width, height, nodes } = (0, esml_1.esml)(state.code, this.SCALE, state.font);
        if (error)
            return error;
        this.svg.innerHTML = svg;
        this.addNodes(nodes);
        this.w = Math.floor(width);
        this.h = Math.floor(height);
        if (state.zoom) {
            this.x = state.x || 0;
            this.y = state.y || 0;
            this.zoom = state.zoom;
        }
        this.transform();
    }
}
exports.Canvas = Canvas;
//# sourceMappingURL=canvas.js.map