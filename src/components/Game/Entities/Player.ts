import { Vector, __fric__, __grav__, __jump__, __size__, __speed__ } from "../Lib";
import { Entity } from "./Entity";

export class Player extends Entity {
    private vel: Vector = { x: 0, y: 0, z: 0 };
    private grounded = false;
    private jumping = 0;
    private jump_timer = 0.66; //second
    private static_movement = true;

    public constructor(pos: Vector) {
        super(pos, { x: __size__, y: __size__, z: __size__ }, "red");
    }

    public tick(platforms: Entity[], delta: number) {
        this.pos.x += this.vel.x * delta;

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
        this.pos.y += this.vel.y * delta;
        this.grounded = false;
        platforms.forEach(platform => {
            if (this.checkCollision(platform)) {
                // y-axis collision
                this.pos.y -= this.vel.y > 0 ? this.bounds.bottom - platform.bounds.top : this.bounds.top - platform.bounds.bottom;
                this.vel.y = 0;
                this.jumping = 0;
                this.grounded = this.pos.y < platform.getPosition.y;
            }
        });

        // jump decay
        if (this.jumping > 0) {
            this.jumping -= delta;
        }
    }

    public move(left: boolean, right: boolean, jump: boolean, jumphold: boolean, delta: number) {
        console.log(jump, jumphold)
        // console.log({ jump, notHold: !jumphold, jumping: this.jumping })
        // Apply Physics
        // not grounded
        if (!this.grounded) {
            // gravity
            if (this.jumping === 0)
                this.vel.y += __grav__ * delta;
        }
        // grounded
        else
        // occurances while grounded
        // 1. Jump
        // 2. Static Movement
        // 3. Directional jumping or moving when jumping
        {
            // friction
            this.vel.x *= __fric__ * delta;

            // non static jump logic
            if (!this.static_movement) { this.vel.y -= __jump__; }
        }

        // static jump logic
        if (this.static_movement) {
            if (this.jumping === 0 && jump && !jumphold) {
                this.jumping = this.jump_timer;
            }

            if (this.jumping > 0 && (jump || jumphold)) {
                this.pos.y -= __jump__ * delta;
                console.log('pos.y:', this.pos.y);
            }
            // this may have unintended consequences
            else if (this.jumping !== 0) this.jumping = 0;
        }

        // static movement
        if (this.static_movement) {
            const speed = left || right ? __speed__ * delta : 0;
            if (left) this.pos.x -= speed;
            if (right) this.pos.x += speed;
        }
        else {
            if (left) this.vel.x -= __speed__;
            if (right) this.vel.x += __speed__;
        }
    }
}