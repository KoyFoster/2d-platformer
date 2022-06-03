import { Vector } from "../Lib";

export abstract class Entity {
    protected pos: Vector;
    protected size: Vector;
    protected color: string;
    protected solid: boolean;

    constructor(pos: Vector, size: Vector, color: string) {
        this.pos = pos;
        this.size = size;
        this.color = color;
        this.solid = true;
    }

    public tick(entity: Entity[] | null, delta: number) { }

    public affect(entity: Entity) {
        return false;
    }

    public draw(ctx: CanvasRenderingContext2D, cam: Vector) {
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.pos.x - (this.size.x * 0.5) - cam.x,
            this.pos.y - (this.size.y * 0.5) - cam.y,
            this.size.x,
            this.size.y);
    }

    public get getPosition() {
        return this.pos;
    }

    public get isSolid() {
        return this.solid;
    }

    public get bounds() {
        const xRad = this.size.x * 0.5;
        const yRad = this.size.y * 0.5;
        return {
            left: this.pos.x - xRad,
            right: this.pos.x + xRad,
            top: this.pos.y - yRad,
            bottom: this.pos.y + yRad,
        }
    }

    public checkCollision(other: Entity) {
        return (
            this.bounds.left < other.bounds.right &&
            this.bounds.right > other.bounds.left &&
            this.bounds.top < other.bounds.bottom &&
            this.bounds.bottom > other.bounds.top
        )
    }
}