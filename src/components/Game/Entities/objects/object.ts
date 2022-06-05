import { Vector } from "../../Lib";
import { Entity } from "../Entity";

export interface Entity_Object {
    anchor: Vector;
    pos: Vector;
    size: Vector;
    vel: Vector;
    color: string;
}

export class BaseObject extends Entity {
    private vel: Vector = { x: 0, y: 0, z: 0 };

    public constructor(pos: Vector, size: Vector, color: string) {
        super(pos, size, color);
        this.solid = false;
    }

    public setVel(vel: Vector) { this.vel = vel }
    public setPos(pos: Vector) { this.pos = pos }
    public setSize(size: Vector) { this.size = size }

    public tick(platforms: Entity[], delta: number) {
        this.pos.x += this.vel.x * delta;
        this.pos.y += this.vel.y * delta;
    }
}