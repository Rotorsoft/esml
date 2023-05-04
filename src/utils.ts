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

type F = (this: ThisParameterType<void>, ...args: any[]) => void;
export const debounce = (func: F, delay: number): F => {
  let timeout: NodeJS.Timeout;
  return function (this: ThisParameterType<void>, ...args: any[]): void {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

type ListenerFn = (...args: any[]) => void;
export class EventEmitter {
  private listeners = new Map<string, Set<ListenerFn>>();
  public on(eventName: string, listener: ListenerFn): void {
    !this.listeners.has(eventName) && this.listeners.set(eventName, new Set());
    this.listeners.get(eventName)!.add(listener);
  }
  public emit(eventName: string, ...args: any[]): void {
    this.listeners.has(eventName) &&
      this.listeners.get(eventName)!.forEach((listener) => listener(...args));
  }
}
