import { Vector, __fric__, __grav__, __jump__, __size__, __speed__ } from "../Lib";
import { Entity } from "./Entity";

export class Player extends Entity {
    private vel: Vector = { x: 0, y: 0, z: 0 };
    private grounded = false;
    private jumping = 0;
    private jump_timer = 0.66; //second
    private jump_disabled = false;

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
                const grounded = this.pos.y < platform.getPosition.y;
                if (grounded) {
                    this.grounded = grounded;
                    this.jump_disabled = false;
                }
            }
        });

        // jump decay
        if (this.jumping > 0) {
            this.jumping -= delta;
        }
        else this.jumping = 0;
    }

    public jump(press: boolean, hold: boolean, delta: number) {
        // jump release
        if (!hold && this.jumping > 0) { this.jump_disabled = true; }

        // continue jumping
        if (hold && this.jumping > 0) this.pos.y -= __jump__ * delta;

        // jump
        if (this.grounded && press) {
            this.vel.y -= __jump__;
            this.jumping = this.jump_timer;
        }
    }

    public move(left: boolean, right: boolean, jump: boolean, jumphold: boolean, delta: number) {
        console.log(jump, jumphold);
        // Apply Physics: friction or gravity
        this.vel.y += __grav__ * delta;

        // jump
        this.jump(jump, jumphold, delta);

        // friction should always be happening
        this.vel.x *= __fric__ * delta;
        if (left) this.vel.x -= __speed__;
        if (right) this.vel.x += __speed__;
    }

    public debug(ctx: CanvasRenderingContext2D) {
        ctx!.fillText(`Grounded:${this.grounded}`, 33, 110);
        ctx!.fillText(`Jumping:${this.jumping}`, 33, 140);
        ctx!.fillText(`Vel:(${this.vel.x}, ${this.vel.y})`, 33, 170);
        ctx!.fillText(`Pos:${this.pos.x}, ${this.pos.y}`, 33, 200);
    }
}