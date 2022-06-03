const __deltacomp1__ = 1000
const __deltacomp2__ = 500
export const __size__ = 20;
export const __speed__ = 400;
export const __fric__ = 0.9;
export const __jump__ = 10 * __deltacomp1__ * 0.05;
export const __grav__ = 0.9 * __deltacomp1__;
export const __terminal__ = 0.9 * __deltacomp1__;
export const __follow__: Vector = { x: 0.05, y: 0.1, z: 0.1 };
export enum HurtType { standard, constant, tick };

export interface Vector {
    x: number;
    y: number;
    z: number;
}