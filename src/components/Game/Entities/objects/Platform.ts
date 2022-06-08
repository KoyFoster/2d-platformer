import { Vector } from '../../Lib';
import { Entity, EntityName } from '../Entity';
import { GenericObject } from './object';

export class Platform extends GenericObject {
    public constructor(pos = { x: 0, y: 0, z: 0 } as Vector, size = { x: 100, y: 10, z: 0 } as Vector, color = 'white' as string) {
        super(pos, size, color);
    }

    public setVel(vel: Vector) {
        this.type = EntityName.Platform;
        this.vel = vel;
    }

    public tick(platforms: Entity[], delta: number) {
        this.pos.x += this.vel.x * delta;
        this.pos.y += this.vel.y * delta;
    }

    public draw(ctx: CanvasRenderingContext2D, cam: Vector) {
        ctx.strokeStyle = this.color;
        ctx.strokeRect(
            this.pos.x - this.bounds.leftRad - cam.x, // x
            this.pos.y - this.bounds.topRad - cam.y, // y
            this.size.x, // w
            this.size.y // h
        );
    }
}
