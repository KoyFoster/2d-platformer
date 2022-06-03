import { Vector } from "../../Lib";
import { Entity } from "../Entity";

export class Platform extends Entity {
    private vel: Vector = { x: 0, y: 0, z: 0 };

    public constructor(pos: Vector, size: Vector, color: string) {
        super(pos, size, color);
    }

    public setVel(vel: Vector) { this.vel = vel }

    public tick(platforms: Entity[], delta: number) {
        this.pos.x += this.vel.x * delta;
        this.pos.y += this.vel.y * delta;
    }
}