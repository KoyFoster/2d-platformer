import { Vector, __follow__ } from "./Lib";
import { Entity, Player } from "./Entities"
const randomcolor = require('randomcolor');

export default class Game {
    private canvas = document.querySelector('canvas') as HTMLCanvasElement;
    private ctx = this.canvas.getContext('2d')!; // The '!' tells TS that the context always exists
    private platforms = [] as Entity[];
    private camera = { x: -this.canvas.width * 0.5, y: -this.canvas.height * 0.5, z: 0 };
    private player = new Player({ x: -20, y: -100, z: 0 });
    private keys = {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false,
    }

    public constructor() {
        // However normal it is in game dev for up to be postive and down to be negative,
        // Adjusting it to be suck, is too much trouble.
        // flip y axis
        // this.ctx.transform(1, 0, 0, -1, 0, this.canvas.height)

        // Input Listeners
        window.addEventListener('keydown', (e) => this.onKey(e, true));
        window.addEventListener('keyup', (e) => this.onKey(e, false));
    }

    public loadMap(map: Vector[][]) {
        map.forEach(row => {
            this.platforms.push(new Entity(row[0], row[1], 'white'))
        })
    }

    // Game Logic
    tick() {
        // backdrop
        this.ctx!.fillStyle = "#000000";
        this.ctx!.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // platforms
        this.platforms.forEach(entity => {
            entity.draw(this.ctx, this.camera);
        });

        this.player.move(this.keys.left, this.keys.right, this.keys.jump)
        this.player.tick(this.platforms);
        this.player.draw(this.ctx, this.camera);

        // update camera on player position
        // The follow multiplier slows down the camera, causing a drag effect
        this.camera.x = Math.round(this.camera.x - (this.camera.x + this.canvas.width / 2 - this.player.getPosition.x) * __follow__.x);
        this.camera.y = Math.round(this.camera.y - (this.camera.y + this.canvas.height / 2 - this.player.getPosition.y) * __follow__.y);

        // UI
        // draw relative to camera
        this.ctx.font = "30px Ariel";
        this.ctx.fillText('FPS', 10, 50);
    }

    private onKey(ev: KeyboardEvent, down: boolean) {
        switch (ev.key) {
            case "ArrowLeft":
            case "a":
                this.keys.left = down;
                break;
            case "ArrowRight":
            case "d":
                this.keys.right = down;
                break;
            case "ArrowUp":
            case "w":
                this.keys.up = down;
                break;
            case "ArrowDown":
            case "s":
                this.keys.down = down;
                break;
            case " ":
            case "Spacebar":
                this.keys.jump = down;
                break;
            default: return;
        }
    }

    addEntity(size: Vector, pos: Vector, color: string) {
        this.platforms.push(new Entity(pos, size, color));
    }

    addRandomEntity() {
        const pos = { x: 20, y: 20, z: 0 };
        const size = { x: 20, y: 20, z: 20 };
        const color = randomcolor();

        this.addEntity(pos, size, color);
    }
}