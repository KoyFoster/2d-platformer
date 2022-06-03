import { HurtType, Vector, __fric__, __grav__, __jump__, __size__, __speed__ } from "../Lib";
import { Entity } from "./Entity";

export class Player extends Entity {
    private health = 92 as number;
    private maxHealth = 92 as number;

    private tickDmg = 0 as number;
    private tickAmt = 0 as number;

    private tickRate = 1 as number;
    private curTick = 1 as number;

    private power = 1 as number; // Idea: give place the option for more dmg or the skipping of previous phases
    private invincibility = 0 as number;
    private iframes = 500; // ms

    private vel: Vector = { x: 0, y: 0, z: 0 };
    private grounded = false;
    private jumping = 0;
    private jump_timer = 0.66; //second
    private jump_disabled = false;

    public constructor(pos: Vector) {
        super(pos, { x: __size__, y: __size__, z: __size__ }, "red");
    }

    public tick(platforms: Entity[], delta: number) {
        // Question: update player tick dmg first or last?
        // tick once every second
        // for the given tick rate
        if (this.tickDmg > 0) {
            // on next tick
            // reduce current tick
            this.curTick -= delta;
            if (this.curTick <= 0) {
                this.curTick = this.tickRate;

                // reduce health
                this.health -= this.tickAmt;
                this.tickDmg -= this.tickAmt;
            }
        }

        // X Collision        
        // note: For all this to function properly. Y needs to be handled separatelyfrom X
        // O(2*n) complexity has to occur
        // X
        this.pos.x += this.vel.x * delta;
        platforms.forEach(platform => {
            if (this.checkCollision(platform)) {
                // perform entity affect on player
                platform.affect(this);

                // x axis collisio
                if (platform.isSolid) {
                    this.pos.x -= this.vel.x > 0 ? this.bounds.right - platform.bounds.left : this.bounds.left - platform.bounds.right;
                    this.vel.x = 0;
                }
            }
        });

        // Y Collision
        this.pos.y += this.vel.y * delta;
        this.grounded = false;
        platforms.forEach(platform => {
            if (this.checkCollision(platform)) {

                if (platform.isSolid) {
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
            }
        });

        // Jump state decay. Used for short hopping
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
        // Apply Physics: friction or gravity
        this.vel.y += __grav__ * delta;

        // jump
        this.jump(jump, jumphold, delta);

        // friction should always be happening
        this.vel.x *= __fric__ * delta;
        if (left) this.vel.x -= __speed__;
        if (right) this.vel.x += __speed__;
    }

    public hurt(amt: number, tickAmt: number, type: HurtType) {
        switch (type) {
            case HurtType.standard:
                if (this.invincibility === 0) {
                    this.health -= amt;
                    // enable i-frames
                    this.invincibility = this.iframes;
                }
                break;

            case HurtType.constant:
                this.health -= amt;
                break;
            case HurtType.tick:
                this.tickDmg += amt;
                // rate of dmg application
                this.tickAmt = tickAmt;
                break;
            default:
                break;
        }
    }

    public debug(ctx: CanvasRenderingContext2D) {
        let basePos = 140;
        ctx!.fillText(`Grounded:${this.grounded}`, 33, basePos);
        ctx!.fillText(`Jumping:${this.jumping}`, 33, basePos += 30);
        ctx!.fillText(`Vel:(${this.vel.x}, ${this.vel.y})`, 33, basePos += 30);
        ctx!.fillText(`Pos:${this.pos.x}, ${this.pos.y}`, 33, basePos += 30);
        basePos += 30;
        ctx!.fillText(`Health:${this.health}`, 33, basePos += 30);
        ctx!.fillText(`TickDmg:${this.tickDmg}`, 33, basePos += 30);
        ctx!.fillText(`CurTick:${this.curTick}`, 33, basePos += 30);
        ctx!.fillText(`CurTick:${this.tickAmt}`, 33, basePos += 30);
    }

    public UI(ctx: CanvasRenderingContext2D) {
        // Healthbar
        const x = 500, y = 600, w = 250, h = 50;
        const lostHp = this.tickDmg / this.maxHealth;
        const hp = (this.health / this.maxHealth) - lostHp;

        // Name
        // ctx!.font = '30px Mars Needs Cunnilingus';
        // ctx!.font = '30px DotumChe';
        // ctx!.font = '30px Hachicro';
        // ctx!.font = '30px Crypt of Tomorrow';
        // ctx!.font = '30px 8bitoperator JVE';
        ctx!.font = '30px Comic Sans MS';
        ctx!.fillStyle = "white";
        ctx!.fillText("CHAR    LV 19        HP", x - 316, y + 35);
        if (this.tickDmg) ctx!.fillStyle = "purple";
        ctx!.fillText(`KR ${this.health} / ${this.maxHealth}`, x + w + 16, y + 35);


        // HP backdrop
        ctx!.fillStyle = "red";
        ctx!.fillRect(x, y, w, h);
        // Lost HP
        ctx!.fillStyle = "purple";
        ctx!.fillRect(x, y, (w * hp) + (w * lostHp), h);
        // True HP
        ctx!.fillStyle = "yellow";
        ctx!.fillRect(x, y, (w * hp), h);
    }
}