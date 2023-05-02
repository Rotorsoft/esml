export interface Vector {
  x: number;
  y: number;
}
export const magnitude = (v: Vector) => Math.sqrt(v.x * v.x + v.y * v.y);
export const difference = (a: Vector, b: Vector) => ({
  x: a.x - b.x,
  y: a.y - b.y,
});
export const distance = (a: Vector, b: Vector) => magnitude(difference(a, b));
export const add = (a: Vector, b: Vector) => ({ x: a.x + b.x, y: a.y + b.y });
export const multiply = (v: Vector, factor: number) => ({
  x: factor * v.x,
  y: factor * v.y,
});
export const normalize = (v: Vector) => multiply(v, 1 / magnitude(v));
export const rotate = (a: Vector) => ({ x: a.y, y: -a.x });

export const splitId = (text: string) => text.trim().split(/(?=[A-Z])/);
export const range = (
  [min, max]: [min: number, max: number],
  count: number
): number[] => {
  var output = [];
  for (var i = 0; i < count; i++)
    output.push(min + ((max - min) * i) / (count - 1));
  return output;
};
