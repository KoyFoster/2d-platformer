import { Vector } from '../../Lib';
import { Entity, EntityName } from '../Entity';
import { Player } from '../Player';
import { GenericObject } from './object';
import { Tractor } from './Tractor';

export class Platform extends GenericObject {
    protected type = EntityName.Platform as EntityName;

    protected tractor = new Tractor({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 'green');

    protected strokeWidth = 1 as number;

    public constructor(pos = { x: 0, y: 0, z: 0 } as Vector, size = { x: 100, y: 10, z: 0 } as Vector, color = 'white' as string) {
        super(pos, size, color);

        // update trackor
        this.tractor.setSize(this.size);
        this.tractor.setPos({ x: this.pos.x, y: this.pos.y - this.size.y + this.strokeWidth, z: this.pos.z });
    }

    public setVel(vel: Vector) {
        this.vel = vel;
    }

    public tick(platforms: Entity[], delta: number) {
        this.pos.x += this.vel.x * delta;
        this.pos.y += this.vel.y * delta;

        // update trackor
        this.tractor.setSize(this.size);
        this.tractor.setPos({ x: this.pos.x, y: this.pos.y - this.size.y + this.strokeWidth, z: this.pos.z });
        this.tractor.setVel(this.vel);
    }

    public affect(other: Player, delta: number) {
        const collision = this.tractor.checkCollision(other, delta);

        if (collision) {
            this.tractor.affect(other as Player, delta);
        }

        return collision;
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
        this.tractor.draw(ctx);
    }
}
