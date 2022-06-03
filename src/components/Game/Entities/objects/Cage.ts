import { Vector } from "../../Lib";
import { Entity } from "../Entity";
import { Player } from "../Player";

export class Cage extends Entity {
    private vel: Vector = { x: 0, y: 0, z: 0 };

    public constructor(pos: Vector, size: Vector, color: string) {
        super(pos, size, color);
    }

    public setVel(vel: Vector) { this.vel = vel }

    public draw(ctx: CanvasRenderingContext2D, cam: Vector): void {
        ctx!.strokeStyle = this.color;
        ctx!.rect(
            this.pos.x - (this.size.x * 0.5) - cam.x,
            this.pos.y - (this.size.y * 0.5) - cam.y,
            this.size.x,
            this.size.y);
        ctx!.stroke();
    }

    public checkInside(other: Entity) {
        return (
            this.bounds.left > other.bounds.right &&
            this.bounds.right < other.bounds.left &&
            this.bounds.top > other.bounds.bottom &&
            this.bounds.bottom < other.bounds.top
        )
    }

    public affect(player: Player) {
        if (this.checkInside(player)) return true;

        // if (player.getPosition.x < this.bounds.left || player.getPosition.x > this.bounds.right) {
        //     // x axis collisiond
        //     player.getPosition.x -= this.vel.x > 0 ? player.bounds.right + this.bounds.left : player.bounds.left + this.bounds.right;
        //     player.getVelocity.x = 0;

        // }
        // Y Collision

        if (player.getPosition.y < this.bounds.top) {
            console.log('top');
            player.getPosition.y = this.bounds.top - player.bounds.bottom;
            // player.getVelocity.y = 0;
            // player.grounded = true;
        }
        else if (player.getPosition.y > this.bounds.bottom) {
            console.log('bottom');
            player.getPosition.y -= this.bounds.bottom;
            // player.getVelocity.y = 0;
            // player.grounded = true;
        }

        return true;
    }
}