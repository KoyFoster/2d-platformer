import { Vector } from "../../Lib";
import { Entity } from "../Entity";
import { Player } from "../Player";

export class Tractor extends Entity {
    private vel: Vector = { x: 0, y: 0, z: 0 };

    public constructor(pos: Vector, size: Vector, color: string) {
        super(pos, size, color);
        this.solid = false;
    }

    public setVel(vel: Vector) { this.vel = vel }

    public tick(platforms: Entity[], delta: number) {
        this.pos.x += this.vel.x * delta;
        this.pos.y += this.vel.y * delta;
    }

    public affect(player: Player, delta: number): boolean {
        // while player is inside
        // move them horzontally
        if (player.getGrounded)
            player.getPosition.x += this.vel.x * delta;

        return true;
    }
}