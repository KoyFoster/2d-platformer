import { Vector } from '../../Lib';
import { Entity, EntityData, EntityName } from '../Entity';

export class GenericObject extends Entity {
    protected type = EntityName.Base as EntityName;

    protected vel: Vector = { x: 0, y: 0, z: 0 };

    public constructor(pos: Vector, size: Vector, color: string) {
        super(pos, size, color);
        this.solid = true;
    }

    public get data(): EntityData {
        return {
            type: this.type,
            anchor: this.anchor,
            pos: this.pos,
            vel: this.vel,
            size: this.size,
            color: this.color,
        };
    }

    public setVel(vel: Vector) {
        this.vel = vel;
    }

    public setPos(pos: Vector) {
        this.pos = pos;
    }

    public setSize(size: Vector) {
        this.size = { x: size.x >= 0 ? size.x : 0, y: size.y >= 0 ? size.y : 0, z: size.z >= 0 ? size.z : 0 };
    }

    public tick(platforms: Entity[], delta: number) {
        this.pos.x += this.vel.x * delta;
        this.pos.y += this.vel.y * delta;
    }
}
