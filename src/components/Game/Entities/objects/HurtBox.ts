import { HurtType, Vector } from '../../Lib';
import { Entity, EntityName } from '../Entity';
import { Player } from '../Player';
import { GenericObject } from './object';

export class HurtBox extends GenericObject {
    protected type = EntityName.HurtBox as EntityName;

    public constructor(pos: Vector, size = { x: 30, y: 60, z: 0 } as Vector, color = '#eeeeee' as string) {
        super(pos, size, color);
        this.solid = false;
    }

    public affect(player: Player, delta: number) {
        player.hurt(1, 0, HurtType.constant);
        player.hurt(50 * delta, 1, HurtType.tick);
        return true;
    }

    public setVel(vel: Vector) {
        this.vel = vel;
    }

    public tick(platforms: Entity[], delta: number) {
        this.pos.x += this.vel.x * delta;
        this.pos.y += this.vel.y * delta;
    }
}
