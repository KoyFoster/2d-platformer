import { Entity, Player, Platform, HurtBox, Cage, Tractor, EntityData } from './Entities';
import cages from './Maps/cages.json';
import { HurtBoxMotion } from './Entities/objects/HurtBoxMotion';
import { DevTools } from '../devtools';
import seq0 from './Maps/sequences/seq_dev.json';
import { Sequence } from './Maps/sequences';

export default class Game {
    private canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

    private ctx = this.canvas.getContext('2d');

    private backEntities = [] as Entity[];

    private foreEntities = [] as Entity[];

    private frame = [] as Entity[];

    private camera = { x: this.canvas.width * 0.5, y: this.canvas.height * 0.5, z: 1 };

    private player = new Player({ x: 0, y: 24, z: 0 });

    private cage = new Cage(cages[2][0], cages[2][1], 'white');

    private keys = {
        left: false,
        right: false,
        up: false,
        down: false,

        jump: false,
    };

    private prevKeys = { jump: false };

    private dev = new DevTools(this.canvas, this.ctx as CanvasRenderingContext2D, this.camera);

    public constructor() {
        this.cage.setAnchor({ x: 0.5, y: 1, z: 0 });

        // Input Listeners
        window.addEventListener('keydown', (e) => this.onKey(e, true));
        window.addEventListener('keyup', (e) => this.onKey(e, false));

        // load sequences
        this.loadSequence(seq0 as Sequence);
    }

    public loadSeq(ent: EntityData[]) {
        ent.forEach((e: EntityData) => {
            let pl = null;
            switch (e.type) {
                case 'platform':
                    pl = new Platform(e.pos, e.size, e.color);
                    pl.setAnchor(e.anchor);
                    pl.setVel(e.vel);
                    this.foreEntities.push(pl);
                    break;
                case 'tractor':
                    pl = new Tractor(e.pos, e.size, e.color);
                    pl.setAnchor(e.anchor);
                    pl.setVel(e.vel);
                    this.foreEntities.push(pl);
                    break;
                case 'motion':
                    pl = new HurtBoxMotion(e.pos, e.size, e.color);
                    pl.setAnchor(e.anchor);
                    pl.setVel(e.vel);
                    this.backEntities.push(pl);
                    break;
                default:
                    pl = new HurtBox(e.pos, e.size, e.color);
                    pl.setAnchor(e.anchor);
                    pl.setVel(e.vel);
                    this.backEntities.push(pl);
                    break;
            }
        });
    }

    public loadSequence(sequence: Sequence) {
        // load cage
        this.cage = new Cage(cages[sequence.cage][0], cages[sequence.cage][1], 'white');
        this.cage.setAnchor({ x: 0.5, y: 1, z: 0 });

        // Set deallocation timer
        const { lifetime } = sequence;
        const interval = setInterval(() => {
            this.backEntities = [];
            clearInterval(interval);
        }, lifetime);

        this.loadSeq(sequence.entities);
    }

    debug() {
        if (this.ctx === null) return;
        this.ctx.fillText(`Entities:${this.backEntities.length}`, 33, 110);
    }

    // Game Logic
    // return ctx when in debug mode
    tick = (delta: number, debug: boolean) => {
        if (this.ctx === null) return;

        // backdrop
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // A) LOGIC
        // backEntities
        this.backEntities.forEach((entity) => {
            entity.tick(null, delta);
        });
        this.foreEntities.forEach((entity) => {
            entity.tick(null, delta);
        });

        const { jump } = this.keys;
        const jumphold = this.keys.jump && this.prevKeys.jump;
        this.player.move(this.keys.left, this.keys.right, jump, jumphold, delta);
        this.player.tick([...this.backEntities, ...this.foreEntities], delta);
        // keep player insize cage
        this.cage.affect(this.player);

        // do to player player velocity being calculated all throughout prior to this
        // we need to calculate platform affects in post in order for motion based
        // affects to apply properly
        // check affects
        this.backEntities.forEach((entity) => {
            if (this.player.checkCollision(entity)) {
                // Done last to ensure that the final velocity affects are calculated
                // perform entity affect on player
                entity.affect(this.player, delta);
            }
        });
        this.foreEntities.forEach((entity) => {
            if (this.player.checkCollision(entity)) {
                entity.affect(this.player, delta);
            }
        });

        // remember previous key presses
        this.prevKeys.jump = this.keys.jump;
        // END OF LOGIC

        // B) Update Camera for Entities
        this.ctx.resetTransform(); // Call thing essentially prevents the translate and similar calls from stacking
        this.ctx.translate(this.camera.x, this.camera.y);

        // C) DRAW
        // player should show behind the objects
        this.player.draw(this.ctx);
        // everything should not show outside the cage, unless they are intelligent objects, like backEntities and blasters
        this.backEntities.forEach((entity) => {
            if (this.ctx !== null) entity.draw(this.ctx);
        });
        // hard coded rectangles outside of cage
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(-150, 350, this.canvas.width * 0.33, this.canvas.height * 0.4);
        this.ctx.fillRect(1010, 350, this.canvas.width * 0.33, this.canvas.height * 0.4);
        this.cage.draw(this.ctx);
        this.foreEntities.forEach((entity) => {
            if (this.ctx !== null) entity.draw(this.ctx);
        });

        // Undo Camera before UI
        this.ctx.translate(-this.camera.x, -this.camera.y);

        this.player.UI(this.ctx);
        this.player.debug(this.ctx);

        // UI
        // draw relative to camera
        this.dev.tick(delta);
        if (debug) {
            this.debug();
            return this.ctx;
        }
    };

    private onKey = (ev: KeyboardEvent, down: boolean) => {
        switch (ev.key) {
            case 'ArrowLeft':
            case 'a':
                this.keys.left = down;
                break;
            case 'ArrowRight':
            case 'd':
                this.keys.right = down;
                break;
            case 'ArrowUp':
            case 'w':
                this.keys.up = down;
                break;
            case 'ArrowDown':
            case 's':
                this.keys.down = down;
                break;
            case ' ':
            case 'Spacebar':
                this.keys.jump = down;
                break;
            default:
        }
    };
}
