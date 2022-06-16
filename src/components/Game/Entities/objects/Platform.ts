import { Vector } from '../../Lib';
import { Entity, EntityName } from '../Entity';
import { Player } from '../Player';
import { GenericObject } from './object';
import { Tractor } from './Tractor';

enum ReturnBahavior {
    // repawn at origin
    Teleport,
    // rebound back to origin
    Rebound,
    // accelerate
    SoftRebound,
    // do not return
    DoNotReturn,
}

export class Platform extends GenericObject {
    protected type = EntityName.Platform as EntityName;

    protected returnBehavior = ReturnBahavior.DoNotReturn;

    protected origin = { x: 0, y: 0, z: 0 } as Vector;

    protected travelDistance = { x: 0, y: 0, z: 0 } as Vector;

    protected tractor = new Tractor({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 'green');

    protected strokeWidth = 1 as number;

    public constructor(pos = { x: 0, y: 0, z: 0 } as Vector, size = { x: 100, y: 10, z: 0 } as Vector, color = 'white' as string) {
        super(pos, size, color);

        // update trackor
        this.tractor.setSize(this.size);
        this.tractor.setPos({ x: this.pos.x, y: this.pos.y - this.size.y + this.strokeWidth, z: this.pos.z });
    }

    public get getTravelBounds() {
        const left = this.origin.x - this.travelDistance.x;
        const right = this.origin.x + this.travelDistance.x;
        const top = this.origin.y - this.travelDistance.y;
        const bottom = this.origin.y + this.travelDistance.y;
        return { left, right, top, bottom };
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

        // if position goes beyond defined distance, then do desired return behavior

        switch (this.returnBehavior) {
            case ReturnBahavior.Teleport:
                {
                    const bounds = this.getTravelBounds;
                    if (this.pos.x >= bounds.right || this.pos.x <= bounds.left) this.pos.x = this.origin.x;
                    if (this.pos.y >= bounds.top || this.pos.y <= bounds.bottom) this.pos.y = this.origin.y;
                }
                break;
            case ReturnBahavior.Rebound:
                {
                    const bounds = this.getTravelBounds;
                    if (this.pos.x >= bounds.right) {
                        this.pos.x = bounds.right;
                        this.vel.x *= -1;
                    }
                    if (this.pos.x <= bounds.left) {
                        this.pos.x = bounds.left;
                        this.vel.x *= -1;
                    }
                    if (this.pos.y >= bounds.bottom) {
                        this.pos.y = bounds.bottom;
                        this.vel.y *= -1;
                    }
                    if (this.pos.y <= bounds.top) {
                        this.pos.y = bounds.top;
                        this.vel.y *= -1;
                    }
                }
                break;
            case ReturnBahavior.SoftRebound:
                break;
            case ReturnBahavior.DoNotReturn:
                break;
            default:
                break;
        }
    }

    public affect(other: Player, delta: number) {
        const collision = this.tractor.checkCollision(other);

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
