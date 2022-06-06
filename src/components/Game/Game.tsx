import { Vector, __speed__ } from "./Lib";
import { Entity, Player, Platform, HurtBox, Cage, Tractor } from "./Entities"
import cages from './Maps/cages.json';
import seq0 from './Maps/sequences/seq_4.json';
import { Sequence } from "./Maps/sequences";
import { HurtBox_Motion } from "./Entities/objects/HurtBox_Motion";
import { DevTools } from "../devtools";
const randomcolor = require('randomcolor');

export default class Game {
    private canvas = document.querySelector('canvas') as HTMLCanvasElement;
    private ctx = this.canvas.getContext('2d')!; // The '!' tells TS that the context always exists
    private platforms = [] as Entity[];
    private frame = [] as Entity[];
    private camera = { x: -this.canvas.width * 0.5, y: -this.canvas.height * 0.75, z: 0 };
    private player = new Player({ x: 0, y: 24, z: 0 });
    private cage = new Cage(cages[2][0], cages[2][1], 'white');
    private keys = {
        left: false,
        right: false,
        up: false,
        down: false,

        jump: false,
    }
    private prevKeys = { jump: false }

    private dev = new DevTools(this.camera);

    public constructor() {
        this.cage.setAnchor({ x: 0.5, y: 0, z: 0 })

        // Input Listeners
        window.addEventListener('keydown', (e) => this.onKey(e, true));
        window.addEventListener('keyup', (e) => this.onKey(e, false));

        // load sequences
        this.loadSequences(seq0);
    }

    public loadSeq(seq: any) {
        seq.entities.forEach((e: any) => {
            // console.warn('new sequence', e)
            let pl = null;
            switch (e.type) {
                case "Platform":
                    pl = new Platform(e.pos, e.size, e.color);
                    pl.setAnchor(e.anchor);
                    break;
                case "tractor":
                    pl = new Tractor(e.pos, e.size, e.color);
                    pl.setAnchor(e.anchor);
                    break;
                case "motion":
                    pl = new HurtBox_Motion(e.pos, e.size, e.color);
                    pl.setAnchor(e.anchor);
                    break;
                default:
                    pl = new HurtBox(e.pos, e.size, e.color);
                    pl.setAnchor(e.anchor);
                    break;
            }
            if (pl !== null) {
                pl!.setVel(e.vel);
                this.platforms.push(pl);
            }
        });
    }

    public loadSequences(sequences: any) {
        // load cage
        this.cage = new Cage(cages[sequences.cage][0], cages[sequences.cage][1], 'white');
        this.cage.setAnchor({ x: 0.5, y: 0, z: 0 })

        // Set deallocation timer      
        const { lifetime } = sequences;
        const interval = setInterval(() => {
            this.platforms = [];
            clearInterval(interval);
        }, lifetime);

        sequences.sequence.forEach((seq: Sequence) => {
            this.loadSeq(seq);
        });
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
        this.cage.affect(this.player);
        this.cage.draw(this.ctx, this.camera);

        // do to player player velocity being calculated all throughout prior to this
        // we need to calculate platform affects in post in order for motion based 
        // affects to apply properly
        // check affects
        this.platforms.forEach(platform => {
            if (this.player.checkCollision(platform)) {
                // Done last to ensure that the final velocity affects are calculated
                // perform entity affect on player
                platform.affect(this.player, delta);
            }
        });

        this.player.draw(this.ctx, this.camera);
        this.player.UI(this.ctx);
        this.player.debug(this.ctx);

        // remember previous key presses
        this.prevKeys.jump = this.keys.jump;

        this.dev.tick(this.ctx, this.camera, delta);

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