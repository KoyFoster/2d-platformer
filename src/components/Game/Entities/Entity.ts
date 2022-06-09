/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
import { Vector } from '../Lib';

export enum EntityName {
    Base = 'base',
    Cage = 'cage',
    Generic = 'generic',
    Platform = 'platform',
    HurtBox = 'hurtbox',
    Tractor = 'tractor',
    Motion = 'motion',
}
export interface EntityData {
    type: EntityName;
    anchor: Vector;
    pos: Vector;
    size: Vector;
    vel: Vector;
    color: string;
}

export abstract class Entity {
    public type = EntityName.Base as EntityName;

    protected pos: Vector;

    public anchor: Vector; // anchor is a percentage value of 1 to 0 of the total size of Entity.

    protected size: Vector;

    protected color: string;

    protected solid: boolean;

    constructor(pos: Vector, size: Vector, color: string) {
        this.pos = pos;
        this.size = size;
        this.anchor = { x: 0.5, y: 0.5, z: 0.5 };
        this.color = color;
        this.solid = true;
    }

    public get getPosition() {
        return this.pos;
    }

    public get getSize() {
        return this.size;
    }

    public get isSolid() {
        return this.solid;
    }

    public setAnchor(anchor: Vector) {
        this.anchor = anchor;
    }

    public get bounds() {
        const xRad = this.size.x * this.anchor.x;
        const yRad = this.size.y * this.anchor.y;
        return {
            left: this.pos.x - (this.size.x - xRad),
            right: this.pos.x + xRad,
            top: this.pos.y - yRad,
            bottom: this.pos.y + (this.size.y - yRad),

            rightRad: xRad,
            leftRad: this.size.x - xRad,
            topRad: yRad,
            bottomRad: this.size.y - yRad,
        };
    }

    public tick(entity: Entity[] | null, delta: number | undefined) { }

    public affect(entity: Entity, delta: number) {
        return false;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.pos.x - this.bounds.leftRad, // x
            this.pos.y - this.bounds.topRad, // y
            this.size.x, // w
            this.size.y
        ); // h
    }

    public checkCollision(other: Entity) {
        return this.bounds.left < other.bounds.right &&
            this.bounds.right > other.bounds.left &&
            this.bounds.top < other.bounds.bottom &&
            this.bounds.bottom > other.bounds.top;
    }

    public checkCollisionV(other: Vector) {
        return this.bounds.left < other.x &&
            this.bounds.right > other.x &&
            this.bounds.top < other.y &&
            this.bounds.bottom > other.y;
    }
}
