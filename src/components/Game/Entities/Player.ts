import { Vector, __fric__, __grav__, __jump__, __size__, __speed__ } from "../Lib";
import { Entity } from "./Entity";

export class Player extends Entity {
    private vel: Vector = { x: 0, y: 0, z: 0 };
    private grounded = false;

    public constructor(pos: Vector) {
        super(pos, { x: __size__, y: __size__, z: __size__ }, "red");
    }

    public tick(platforms: Entity[]) {
        this.pos.x += this.vel.x;

        // Collision        
        // note: For all this to function properly. Y needs to be handled separatelyfrom X
        // O(2*n) complexity has to occur
        // X
        platforms.forEach(platform => {
            if (this.checkCollision(platform)) {
                // x axis collision
                this.pos.x -= this.vel.x > 0 ? this.bounds.right - platform.bounds.left : this.bounds.left - platform.bounds.right;
                this.vel.x = 0;
            }
        });

        // Y
        this.pos.y += this.vel.y;
        this.grounded = false;
        platforms.forEach(platform => {
            if (this.checkCollision(platform)) {
                // y-axis collision
                this.pos.y -= this.vel.y > 0 ? this.bounds.bottom - platform.bounds.top : this.bounds.top - platform.bounds.bottom;
                this.vel.y = 0;
                this.grounded = this.pos.y > platform.getPosition.y;
            }
        });

        // if (this.pos.y < 0) {
        //     this.grounded = true;
        //     this.pos.y = 0; this.vel.y = 0;
        // }
    }

    public move(left: Boolean, right: Boolean, jump: Boolean) {
        // Apply Physics
        // not grounded
        if (!this.grounded) {
            // gravity
            this.vel.y += __grav__;

        }
        // grounded
        else {
            // friction
            this.vel.x *= __fric__;
            // move
            if (left) this.vel.x -= __speed__;
            if (right) this.vel.x += __speed__;
            if (jump) {
                this.grounded = false;
                this.vel.y += __jump__;
            }
        }
    }
}