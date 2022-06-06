import { Vector } from "../../Lib";
import { Entity } from "../Entity";
import { Player } from "../Player";

export class Cage extends Entity {
    private vel: Vector = { x: 0, y: 0, z: 0 };
    private lineThickness: number = 12;

    public constructor(pos: Vector, size: Vector, color: string) {
        super(pos, size, color);
    }

    public setVel(vel: Vector) { this.vel = vel }

    public draw(ctx: CanvasRenderingContext2D, cam: Vector): void {
        ctx!.strokeStyle = this.color;
        ctx!.lineWidth = this.lineThickness;
        ctx!.rect(
            this.pos.x - (this.size.x * 0.5) - cam.x,
            this.pos.y - (this.size.y * 0.5) - cam.y,
            this.size.x,
            this.size.y);
        ctx!.stroke();
    }

    public affect(player: Player) {

        // X Collision
        let radius = ((this.lineThickness * 0.5 + player.bounds.leftRad));
        if (player.getPosition.x < this.bounds.left + radius) {
            player.getPosition.x = this.bounds.left + radius;
            player.getVelocity.x = 0;
        }
        else if (player.getPosition.x > this.bounds.right - radius) {
            player.getPosition.x = this.bounds.right - radius;
            player.getVelocity.x = 0;
        }

        // Y Collision
        // Bottom Collision
        radius = ((this.lineThickness * 0.5 + player.bounds.bottomRad));
        if (player.getPosition.y > this.bounds.bottom - radius) {
            player.getPosition.y = this.bounds.bottom - radius;
            player.getVelocity.y = 0;
            player.grounded = true;
        }
        // Top Collision
        else if (player.getPosition.y < this.bounds.top + radius) {
            player.getPosition.y = this.bounds.top + radius;
            player.getVelocity.y = 0;
            player.jumping = 0;
        }

        return true;
    }
}