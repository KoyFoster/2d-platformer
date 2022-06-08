import { HurtType, Vector } from '../../Lib';
import { Entity, EntityName } from '../Entity';
import { Player } from '../Player';
import { GenericObject } from './object';

export class HurtBoxMotion extends GenericObject {
    public constructor(pos: Vector, size: Vector, color: string) {
        super(pos, size, color);
        this.type = EntityName.Motion;
        this.solid = false;
    }

    public affect(player: Player, delta: number) {
        if (player.getVelocity.x !== 0 || player.getVelocity.y !== 0) {
            console.log(player.getVelocity);
            player.hurt(1, 0, HurtType.constant);
            player.hurt(50 * delta, 1, HurtType.tick);
        }
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
