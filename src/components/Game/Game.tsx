import { Vector, __follow__, __speed__ } from "./Lib";
import { Entity, Player, Platform, HurtBox, Cage } from "./Entities"
import cages from './Maps/cages.json'
const randomcolor = require('randomcolor');

export default class Game {
    private canvas = document.querySelector('canvas') as HTMLCanvasElement;
    private ctx = this.canvas.getContext('2d')!; // The '!' tells TS that the context always exists
    private platforms = [] as Entity[];
    private frame = [] as Entity[];
    private camera = { x: -this.canvas.width * 0.5, y: -this.canvas.height * 0.75, z: 0 };
    private player = new Player({ x: -20, y: -100, z: 0 });
    private Cage = new Cage(cages[1][0], cages[1][1], 'white');
    private keys = {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false,
    }
    private prevKeys = { jump: false }

    public constructor() {
        // Input Listeners
        window.addEventListener('keydown', (e) => this.onKey(e, true));
        window.addEventListener('keyup', (e) => this.onKey(e, false));
    }

    public loadMap(map: Vector[][]) {
        map.forEach(row => {
            this.platforms.push(new Platform(row[0], row[1], 'white'));
        });

        // Test HurtBox
        const pl = new HurtBox({ x: -500, y: 0, z: 0 }, { x: 20, y: 100, z: 0 }, 'green');
        pl.setVel({ x: __speed__, y: 0, z: 0 });
        this.platforms.push(pl);
    }

    // Deallocation boundaries: unload Entities if they leave the zone
    deallocate() {
        const deathBounds = 1000;
        const remainder = [] as Entity[];
        this.platforms.forEach(pl => {
            if (!(pl.getPosition.x > deathBounds || pl.getPosition.x < -deathBounds ||
                pl.getPosition.y > deathBounds || pl.getPosition.y < -deathBounds))
                remainder.push(pl)
        })

        if (this.platforms.length !== remainder.length)
            console.log('pls:', this.platforms.length, 'remainder:', remainder.length);
        this.platforms = remainder;
    }

    debug() {
        this.ctx!.fillText(`Entities:${this.platforms.length}`, 33, 110);
    }

    // Game Logic
    // return ctx when in debug mode
    tick = (delta: number, debug: boolean) => {

        // backdrop
        this.ctx!.fillStyle = "#000000";
        this.ctx!.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // platforms
        this.platforms.forEach(entity => {
            entity.tick(null, delta);
            entity.draw(this.ctx, this.camera);
        });

        const jump = this.keys.jump;
        const jumphold = (this.keys.jump && this.prevKeys.jump);
        this.player.move(this.keys.left, this.keys.right, jump, jumphold, delta);
        this.player.tick(this.platforms, delta);
        // keep player insize cage
        this.Cage.affect(this.player);
        this.Cage.draw(this.ctx, this.camera);

        this.player.draw(this.ctx, this.camera);
        this.player.UI(this.ctx);
        this.player.debug(this.ctx);


        // update camera on player position
        // The follow multiplier slows down the camera, causing a drag effect
        // this.camera.x = Math.round(this.camera.x - (this.camera.x + this.canvas.width / 2 - this.player.getPosition.x) * __follow__.x * delta);
        // this.camera.y = Math.round(this.camera.y - (this.camera.y + this.canvas.height / 2 - this.player.getPosition.y) * __follow__.y * delta);

        // remember previous key presses
        this.prevKeys.jump = this.keys.jump;


        // Deallocation boundaries: unload Entities if they leave the zone
        this.deallocate();

        // UI
        // draw relative to camera
        if (debug) {
            this.debug();
            return this.ctx;
        }
    }

    private onKey = (ev: KeyboardEvent, down: boolean) => {
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
        this.platforms.push(new Platform(pos, size, color));
    }

    addRandomEntity() {
        const pos = { x: 20, y: 20, z: 0 };
        const size = { x: 20, y: 20, z: 20 };
        const color = randomcolor();

        this.addEntity(pos, size, color);
    }
}