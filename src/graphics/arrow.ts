import { Config, Edge } from "../artifacts";
import { add, difference, multiply, normalize, rotate } from "../utils";
import { Graphics } from "./types";

export const drawArrow = (edge: Edge, g: Graphics, config: Config) => {
  if (edge.arrow) {
    const end = edge.path![edge.path!.length - 2];
    const path = edge.path!.slice(1, -1);
    const size = (config.spacing * config.arrowSize) / 30;
    const dir = normalize(difference(path[path.length - 2], path.at(-1)!));
    const x = (s: number) => add(end, multiply(dir, s * size));
    const y = (s: number) => multiply(rotate(dir), s * size);
    const circuit = [add(x(10), y(4)), x(5), add(x(10), y(-4)), end];
    g.fillStyle(config.stroke);
    g.circuit(circuit).fillAndStroke();
  }
};
