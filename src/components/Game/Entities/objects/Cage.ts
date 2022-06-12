import { Vector } from '../../Lib';
import { EntityName } from '../Entity';
import { Player } from '../Player';
import { GenericObject } from './object';

export class Cage extends GenericObject {
    protected type = EntityName.Vage as EntityName;

    protected vel: Vector = { x: 0, y: 0, z: 0 };

    protected lineWidth = 10;

    protected halfWidth = 5;

    public constructor(pos: Vector, size = { x: 464, y: 464, z: 1 } as Vector, color = '#eeeeee' as string) {
        super(pos, size, color);
        this.solid = false;
    }

    public setVel(vel: Vector) {
        this.type = EntityName.Cage;
        this.vel = vel;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        // outset
        ctx.strokeRect(
            this.pos.x - this.bounds.leftRad + this.halfWidth, // x
            this.pos.y - this.bounds.topRad + this.halfWidth, // y
            this.size.x - this.lineWidth, // w
            this.size.y - this.lineWidth // h
        );
    }

    public affect(player: Player) {
        // X Collision
        let radius = this.lineWidth * 0.5 + player.bounds.leftRad;
        if (player.getPosition.x < this.bounds.left + radius + this.halfWidth) {
            player.getPosition.x = this.bounds.left + radius + this.halfWidth;
            player.getVelocity.x = 0;
        } else if (player.getPosition.x > this.bounds.right - radius - this.halfWidth) {
            player.getPosition.x = this.bounds.right - radius - this.halfWidth;
            player.getVelocity.x = 0;
        }

        // Y Collision
        // Bottom Collision
        radius = this.lineWidth * 0.5 + player.bounds.bottomRad;
        if (player.getPosition.y > this.bounds.bottom - radius - this.halfWidth) {
            player.getPosition.y = this.bounds.bottom - radius - this.halfWidth;
            player.getVelocity.y = 0;
            player.grounded = true;
        }
        // Top Collision
        else if (player.getPosition.y < this.bounds.top + radius + this.halfWidth) {
            player.getPosition.y = this.bounds.top + radius + this.halfWidth;
            player.getVelocity.y = 0;
            player.jumping = 0;
        }

        return true;
    }
}
