export interface Vector {
    x: number;
    y: number;
}
export declare const magnitude: (v: Vector) => number;
export declare const difference: (a: Vector, b: Vector) => {
    x: number;
    y: number;
};
export declare const distance: (a: Vector, b: Vector) => number;
export declare const add: (a: Vector, b: Vector) => {
    x: number;
    y: number;
};
export declare const multiply: (v: Vector, factor: number) => {
    x: number;
    y: number;
};
export declare const normalize: (v: Vector) => {
    x: number;
    y: number;
};
export declare const rotate: (a: Vector) => {
    x: number;
    y: number;
};
export declare const pad: (n: number, l: number) => string;
export declare const splitId: (text: string) => string[];
type F = (this: ThisParameterType<void>, ...args: any[]) => void;
export declare const debounce: (func: F, delay: number) => F;
type ListenerFn = (...args: any[]) => void;
export declare class EventEmitter {
    private listeners;
    on(eventName: string, listener: ListenerFn): void;
    emit(eventName: string, ...args: any[]): void;
}
export {};
//# sourceMappingURL=utils.d.ts.map