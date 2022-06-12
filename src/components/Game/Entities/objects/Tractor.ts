import { Vector } from '../../Lib';
import { Entity, EntityName } from '../Entity';
import { Player } from '../Player';
import { GenericObject } from './object';

export class Tractor extends GenericObject {
    protected type = EntityName.Tractor as EntityName;

    protected strokeWidth = 1 as number;

    public constructor(pos: Vector, size: Vector, color: string) {
        super(pos, size, color);
        this.solid = false;
    }

    public setVel(vel: Vector) {
        this.vel = vel;
    }

    public tick(platforms: Entity[], delta: number) {
        this.pos.x += this.vel.x * delta;
        this.pos.y += this.vel.y * delta;
    }

    public affect(player: Player, delta: number): boolean {
        // while player is inside
        // move them horzontally
        if (player.getGrounded) player.getPosition.x += this.vel.x * delta;

        return true;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.strokeWidth;
        ctx.strokeRect(
            this.pos.x - this.bounds.leftRad, // x
            this.pos.y - this.bounds.topRad, // y
            this.size.x, // w
            this.size.y // h
        );
    }
}
