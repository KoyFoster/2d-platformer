import { Vector } from '../../Lib';
import { EntityName } from '../Entity';
import { Player } from '../Player';
import { GenericObject } from './object';

export class Cage extends GenericObject {
    protected vel: Vector = { x: 0, y: 0, z: 0 };

    protected lineThickness = 12;

    public setVel(vel: Vector) {
        this.type = EntityName.Cage;
        this.vel = vel;
    }

    public draw(ctx: CanvasRenderingContext2D, cam: Vector) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineThickness;
        ctx.strokeRect(
            this.pos.x - this.bounds.leftRad - cam.x, // x
            this.pos.y - this.bounds.topRad - cam.y, // y
            this.size.x, // w
            this.size.y // h
        );
    }

    public affect(player: Player) {
        // X Collision
        let radius = this.lineThickness * 0.5 + player.bounds.leftRad;
        if (player.getPosition.x < this.bounds.left + radius) {
            player.getPosition.x = this.bounds.left + radius;
            player.getVelocity.x = 0;
        } else if (player.getPosition.x > this.bounds.right - radius) {
            player.getPosition.x = this.bounds.right - radius;
            player.getVelocity.x = 0;
        }

        // Y Collision
        // Bottom Collision
        radius = this.lineThickness * 0.5 + player.bounds.bottomRad;
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
