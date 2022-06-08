export interface Vector {
    x: number;
    y: number;
    z: number;
}

export class VectorMath {
    // adds second value to the first by reference
    static add(v1: Vector, v2: Vector) {
        v1.x += v2.x;
        v1.y += v2.y;
        v1.z += v2.z;
    }

    static sub(v1: Vector, v2: Vector) {
        v1.x -= v2.x;
        v1.y -= v2.y;
        v1.z -= v2.z;
    }
}

const __deltacomp1__ = 500;
export const __size__ = 35;
export const __speed__ = 400;
export const __fric__ = 0.9;
export const __jump__ = 8 * __deltacomp1__ * 0.05;
export const __grav__ = 0.9 * __deltacomp1__;
export const __terminal__ = 700; // seems to be good for 20fps
export const __follow__: Vector = { x: 0.05, y: 0.1, z: 0.1 };
export enum HurtType {
    standard,
    constant,
    tick,
}
