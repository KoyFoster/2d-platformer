import _ from 'lodash';
import { IHashMap, MouseDrag } from '../utils';
import { Cage, EntityData, EntityName, GenericObject, HurtBox, Platform } from './Game/Entities';
import { HurtBoxMotion } from './Game/Entities/objects/HurtBoxMotion';
import { Vector, VectorMath } from './Game/Lib';

enum CmdState {
    T,
    E,
    A,
    P,
    S,
    V,
    C,
    Color,
    Cam,
    NONE,
}
enum SubCmd {
    X,
    Y,
    Add,
    Sub,
    NONE,
}

export class DevTools {
    private canvas: HTMLCanvasElement;

    private ctx: CanvasRenderingContext2D;

    mouse = { x: 0, y: 0, z: 0 } as Vector;

    hide = false as boolean;

    pause = false as boolean;

    showGrid = false as boolean;

    // Entity creation properties
    inputBuffer: string;

    validInput: boolean;

    cmdState: CmdState;

    subCmd: SubCmd;

    fi = null as number | null; // focus index

    selected = [] as number[];

    origin = { x: 0, y: 0, z: 1 } as Vector;

    cam = { x: 0, y: 0, z: 1 } as Vector;

    entities = [] as GenericObject[];

    data = [] as EntityData[];

    clipboard = [] as EntityData[];

    history = [] as EntityData[][]; // saves deep states of all major changes

    // states
    snapToGridX = 10 as number; // as in only translate on x or y axis

    snapToGridY = 10 as number; // as in only translate on x or y axis

    drag = new MouseDrag() as MouseDrag;

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, defaultCam: Vector, origin: Vector) {
        this.canvas = canvas;
        this.ctx = ctx;
        if (defaultCam) {
            this.origin = origin;
            this.cam = defaultCam;
        }
        let lastSave = localStorage.getItem('lastObject') as EntityData[] | string | null;
        lastSave = lastSave ? (JSON.parse(lastSave as string) as EntityData[]) : ([] as EntityData[]);

        const hide = localStorage.getItem('hideDev');
        if (hide && hide === 'true') this.hide = true;
        const pause = localStorage.getItem('pauseDev');
        if (pause && pause === 'true') this.pause = true;
        const showGrid = localStorage.getItem('showGrid');
        if (showGrid && showGrid === 'true') this.showGrid = true;

        console.log(lastSave);
        // Entity creation properties
        this.inputBuffer = '';
        this.validInput = false;
        this.cmdState = CmdState.NONE;
        this.subCmd = SubCmd.NONE;

        if (lastSave.length > 0) {
            this.data = lastSave;
            // load in all objects
            this.loadEntities();
        }
        // create initial entity
        else {
            this.addEntity(
                {
                    type: EntityName.Generic,
                    anchor: { x: 0, y: 0, z: 0.5 },
                    pos: { x: 0, y: 0, z: 0 },
                    size: { x: 10, y: 10, z: 0 },
                    vel: { x: 0, y: 0, z: 0 },
                    color: 'white',
                },
                false,
                true
            );
        }
        // copy over settings of first element
        this.fi = 0;

        // SETUP LISTENER
        window.addEventListener('mouseup', (e) => this.onClick(e));
        window.addEventListener('mouseup', (e) => this.selectEntity(e));
        window.addEventListener('mousedown', () => this.drag.doDrag(true));
        window.addEventListener('mouseup', (e) => this.onMouseRelease(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('wheel', (e) => this.onScroll(e));
        // window.addEventListener('keyup', (e) => this.subCommands(e));
        // window.addEventListener('keyup', (e) => this.commands(e));
        window.addEventListener('keydown', (e) => this.macros(e));
    }

    // destroy and recreate entities from meta data
    loadEntities() {
        this.entities = [];
        // load in all objects
        this.data.forEach((ent) => {
            this.addEntity(ent, false, false);
        });
    }

    // focus and selection handling
    setFocus(i: number) {
        this.fi = i;
        // set to start of selected
        this.selected = this.selected.filter((s) => s !== i);
        this.selected.unshift(i);
    }

    setSelection(sel: number[]) {
        this.selected = sel;
        // focus first element
        this.fi = sel.length ? sel[0] : null;
    }

    addSelected(i: number) {
        // add to the begining of the list, so that is is focused
        this.selected.unshift(i);
    }

    deselect() {
        this.selected = [];
    }

    // Commands
    commands(e: KeyboardEvent) {
        // on F1 Hide Dev Tool
        if (e.key === 'F2') {
            this.hide = !this.hide;
            localStorage.setItem('hideDev', this.hide ? 'true' : 'false');
            return;
        }
        if (e.key === 'F4') {
            this.pause = !this.pause;
            localStorage.setItem('pauseDev', this.pause ? 'true' : 'false');
            return;
        }
        if (e.key === 'F8') {
            this.showGrid = !this.showGrid;
            localStorage.setItem('showGrid', this.showGrid ? 'true' : 'false');
            return;
        }

        if (this.subCmd === SubCmd.NONE && this.cmdState === CmdState.NONE)
            switch (e.key.toLowerCase()) {
                case 't':
                    this.cmdState = CmdState.T;
                    break;
                case 'e':
                    this.cmdState = CmdState.E;
                    break;
                case 'a':
                    this.cmdState = CmdState.A;
                    break;
                case 'p':
                    this.cmdState = CmdState.P;
                    break;
                case 'v':
                    this.cmdState = CmdState.V;
                    break;
                case 's':
                    this.cmdState = CmdState.S;
                    break;
                case 'r':
                    this.reload();
                    break;
                case 'c':
                    if (e.shiftKey) {
                        if (e.shiftKey && e.altKey) {
                            this.entities = [];
                            this.data = [];
                            this.fi = null;
                            this.save();
                        } else if (this.cmdState === CmdState.NONE) {
                            this.saveToConsole();
                        }
                    } else {
                        this.cmdState = CmdState.Color;
                        this.inputBuffer = this.fi !== null ? this.data[this.fi].color : '';
                    }
                    break;
                case 'enter':
                case 'escape':
                    break;
                default:
                    break;
            }
    }

    getValidInput(clear = false as boolean): number {
        let result = 0 as number;
        result = Number(this.inputBuffer);
        this.validInput = !Number.isNaN(result);
        if (this.validInput && clear) this.inputBuffer = '';
        return result;
    }

    changeEntityType(type: EntityName) {
        let changes = false;
        // save current state
        this.history.unshift(_.cloneDeep(this.data));

        this.data.forEach((d, index) => {
            if (d.type !== type) {
                changes = true;
                d.type = type;
                this.reloadEntity(index);
            }
        });

        if (changes) this.save();
        // shift if no changes were made
        else this.history.shift();
    }

    reloadFocused() {
        if (this.fi !== null) {
            this.reloadEntity(this.fi);
            this.save();
        }
    }

    changeEntityColor(color: string) {
        if (this.fi !== null && this.data[this.fi].color !== color) {
            this.data[this.fi].color = color;
            this.reloadEntity(this.fi);
            this.save();
        }
    }

    // enum SubCmd { Px, Py, Sx, Sy, Vx, Vy, NONE };
    subCommands(e: KeyboardEvent) {
        const key = e.key.toLowerCase();
        if (this.subCmd === SubCmd.NONE)
            switch (this.cmdState) {
                case CmdState.NONE:
                    break;
                case CmdState.T:
                    switch (key) {
                        case 'c':
                            this.changeEntityType(EntityName.Cage);
                            break;
                        case 'p':
                            this.changeEntityType(EntityName.Platform);
                            break;
                        case 'h':
                            this.changeEntityType(EntityName.HurtBox);
                            break;
                        case 'm':
                            this.changeEntityType(EntityName.Motion);
                            break;
                        case 'escape':
                            this.cmdState = CmdState.NONE;
                            break;
                        default:
                            break;
                    }
                    break;
                case CmdState.E:
                    switch (key) {
                        case '=':
                        case '+':
                            if (this.fi !== null) {
                                this.addEntity(this.data[this.fi], true);
                                this.fi = this.entities.length - 1;
                                this.save();
                            }
                            break;
                        case '-':
                            this.subEntity();
                            this.save();
                            break;
                        case 'escape':
                            this.cmdState = CmdState.NONE;
                            break;
                        default:
                            break;
                    }
                    break;
                case CmdState.Color:
                    switch (key) {
                        case 'escape':
                            break;
                        case 'enter':
                            {
                                // validate color
                                const lastStyle = this.ctx.fillStyle;
                                this.ctx.fillStyle = this.inputBuffer;
                                console.log('this.ctx.fillStyle:', this.ctx.fillStyle);
                                if (this.ctx.fillStyle === this.inputBuffer) {
                                    this.changeEntityColor(this.inputBuffer);
                                    this.cmdState = CmdState.NONE;
                                }
                                this.ctx.fillStyle = lastStyle;
                            }
                            break;
                        default:
                            this.captureInput(key);
                            break;
                    }
                    break;
                case CmdState.A:
                    switch (key) {
                        case 'x':
                            this.subCmd = SubCmd.X;
                            break;
                        case 'y':
                            this.subCmd = SubCmd.Y;
                            break;
                        case 'escape':
                            this.cmdState = CmdState.NONE;
                            break;
                        default:
                            break;
                    }
                    break;
                case CmdState.P:
                    switch (key) {
                        case 'x':
                            this.subCmd = SubCmd.X;
                            break;
                        case 'y':
                            this.subCmd = SubCmd.Y;
                            break;
                        case 'escape':
                            this.cmdState = CmdState.NONE;
                            break;
                        default:
                            break;
                    }
                    break;
                case CmdState.S:
                    switch (key) {
                        case 'x':
                            this.subCmd = SubCmd.X;
                            break;
                        case 'y':
                            this.subCmd = SubCmd.Y;
                            break;
                        case 'enter':
                        case 'escape':
                            this.cmdState = CmdState.NONE;
                            break;
                        default:
                            break;
                    }
                    break;
                case CmdState.V:
                    switch (key) {
                        case 'x':
                            this.subCmd = SubCmd.X;
                            break;
                        case 'y':
                            this.subCmd = SubCmd.Y;
                            break;
                        case 'escape':
                            this.cmdState = CmdState.NONE;
                            break;
                        default:
                            break;
                    }
                    break;
                default:
                    break;
            }
        else if (this.fi !== null) {
            this.captureInput(key);

            // check input
            let buffer = 0 as number | null;
            switch (key) {
                case 'escape':
                    this.subCmd = SubCmd.NONE;
                    break;

                // Apply changes to entity property
                case 'enter':
                    {
                        let change = false;
                        buffer = this.getValidInput(true);

                        // validate input
                        if (!Number.isNaN(buffer)) {
                            switch (this.cmdState) {
                                case CmdState.A:
                                    change = true;
                                    switch (this.subCmd) {
                                        case SubCmd.X:
                                            this.data[this.fi].anchor.x = buffer;
                                            this.subCmd = SubCmd.NONE;
                                            break;
                                        case SubCmd.Y:
                                            this.data[this.fi].anchor.y = buffer;
                                            this.subCmd = SubCmd.NONE;
                                            break;
                                        default:
                                            break;
                                    }
                                    break;
                                case CmdState.P:
                                    change = true;
                                    switch (this.subCmd) {
                                        case SubCmd.X:
                                            buffer -= buffer % this.snapToGridX;
                                            this.data[this.fi].pos.x = buffer;
                                            this.subCmd = SubCmd.NONE;
                                            break;
                                        case SubCmd.Y:
                                            buffer -= buffer % this.snapToGridY;
                                            this.data[this.fi].pos.y = buffer;
                                            this.subCmd = SubCmd.NONE;
                                            break;
                                        default:
                                            break;
                                    }
                                    break;
                                case CmdState.S:
                                    change = true;
                                    switch (this.subCmd) {
                                        case SubCmd.X:
                                            buffer -= buffer % this.snapToGridX;
                                            this.data[this.fi].size.x = buffer;
                                            this.subCmd = SubCmd.NONE;
                                            break;
                                        case SubCmd.Y:
                                            buffer -= buffer % this.snapToGridY;
                                            this.data[this.fi].size.y = buffer;
                                            this.subCmd = SubCmd.NONE;
                                            break;
                                        default:
                                            break;
                                    }
                                    break;
                                case CmdState.V:
                                    change = true;
                                    switch (this.subCmd) {
                                        case SubCmd.X:
                                            this.data[this.fi].vel.x = buffer;
                                            this.subCmd = SubCmd.NONE;
                                            break;
                                        case SubCmd.Y:
                                            this.data[this.fi].vel.y = buffer;
                                            this.subCmd = SubCmd.NONE;
                                            break;
                                        default:
                                            break;
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }

                        // on successful update
                        if (change) {
                            this.reloadFocused();
                            this.save();
                        }
                    }
                    break; // end of Enter
                default:
                    break;
            } // end of key switch
        }
    }

    captureInput(key: string) {
        switch (key) {
            case 'backspace':
                this.inputBuffer = this.inputBuffer.slice(0, this.inputBuffer.length - 1);
                break;
            default:
                break;
        }
        if (key.length > 1) return;
        switch (key) {
            default:
                this.inputBuffer += key;
                break;
        }
    }

    showCommands() {
        if (this.fi === null) return;
        this.ctx.font = '24px Ariel';
        let yPos = 20;
        this.ctx.fillText(`Commands:`, 650, (yPos += 30));
        switch (this.cmdState) {
            case CmdState.NONE:
                {
                    this.ctx.fillText(`F2: Hide F4: Pause(${this.pause}) F8: Grid(${this.showGrid}) Zoom(${Math.trunc(this.cam.z * 100)}%)`, 700, (yPos += 30));
                    this.ctx.fillText(`T: Set Entity Type: ${this.fi !== null ? this.data[this.fi].type : 'NA'}`, 700, (yPos += 30));
                    this.ctx.fillText(`E: Entity Options(${this.fi}): ${this.entities.length}|${this.data.length} present`, 700, (yPos += 30));
                    this.ctx.fillText(`A: set Anchor: [${this.data[this.fi].anchor.x}, ${this.data[this.fi].anchor.y}]`, 700, (yPos += 30));
                    this.ctx.fillText(`P: set Position: [${this.data[this.fi].pos.x}, ${this.data[this.fi].pos.y}]`, 700, (yPos += 30));
                    this.ctx.fillText(`V: set Velocity${this.data[this.fi].vel ? `: [${this.data[this.fi].vel.x}, ${this.data[this.fi].vel.y}]` : ''}`, 700, (yPos += 30));
                    this.ctx.fillText(`S: set Size: [${this.data[this.fi].size.x}, ${this.data[this.fi].size.y}]`, 700, (yPos += 30));
                    const prevStyle = this.ctx.fillStyle;
                    this.ctx.fillStyle = this.data[this.fi].color;
                    this.ctx.fillText(`C: color: ${this.data[this.fi].color}`, 700, (yPos += 30));
                    this.ctx.fillStyle = prevStyle;
                    this.ctx.fillText(`R: reload`, 700, (yPos += 30));
                    this.ctx.fillText(`C: cancel settings`, 700, (yPos += 30));
                }
                break;
            case CmdState.T:
                switch (this.subCmd) {
                    default:
                        this.ctx.fillText(`T: Platform(P) HurtBox(H) MotionHB(M) Cage(C)`, 700, (yPos += 30));
                        break;
                }
                break;
            case CmdState.E:
                switch (this.subCmd) {
                    default:
                        this.ctx.fillText(`E: add(+) sub(-)`, 700, (yPos += 30));
                        break;
                }
                break;

            case CmdState.Color:
                {
                    const prevStyle = this.ctx.fillStyle;
                    this.ctx.fillStyle = this.inputBuffer;
                    this.ctx.fillText(`Color: [${this.inputBuffer}]`, 700, (yPos += 30));
                    this.ctx.fillStyle = prevStyle;
                }
                break;
            case CmdState.A:
                switch (this.subCmd) {
                    case SubCmd.X:
                        this.vectorMsgTemplate('P', true, this.data[this.fi].anchor, (yPos += 30));
                        break;
                    case SubCmd.Y:
                        this.vectorMsgTemplate('P', false, this.data[this.fi].anchor, (yPos += 30));
                        break;
                    default:
                        this.ctx.fillText(`A: enter x(X), enter y(Y): [${this.data[this.fi].anchor.x}, ${this.data[this.fi].anchor.y}]`, 700, (yPos += 30));
                        break;
                }
                break;
            case CmdState.P:
                switch (this.subCmd) {
                    case SubCmd.X:
                        this.vectorMsgTemplate('P', true, this.data[this.fi].pos, (yPos += 30));
                        break;
                    case SubCmd.Y:
                        this.vectorMsgTemplate('P', false, this.data[this.fi].pos, (yPos += 30));
                        break;
                    default:
                        this.ctx.fillText(`P: enter x(X), enter y(Y): [${this.data[this.fi].pos.x}, ${this.data[this.fi].pos.y}]`, 700, (yPos += 30));
                        break;
                }
                break;
            case CmdState.S:
                switch (this.subCmd) {
                    case SubCmd.X:
                        this.vectorMsgTemplate('S', true, this.data[this.fi].size, (yPos += 30));
                        break;
                    case SubCmd.Y:
                        this.vectorMsgTemplate('S', false, this.data[this.fi].size, (yPos += 30));
                        break;
                    default:
                        this.ctx.fillText(`S: enter x(X), enter y(Y): [${this.data[this.fi].size.x}, ${this.data[this.fi].size.y}]`, 700, (yPos += 30));
                        break;
                }
                break;
            case CmdState.V:
                switch (this.subCmd) {
                    case SubCmd.X:
                        this.vectorMsgTemplate('V', true, this.data[this.fi].vel, (yPos += 30));
                        break;
                    case SubCmd.Y:
                        this.vectorMsgTemplate('V', false, this.data[this.fi].vel, (yPos += 30));
                        break;
                    default:
                        this.ctx.fillText(`V: enter x(X), enter y(Y): [${this.data[this.fi].vel.x}, ${this.data[this.fi].vel.y}]`, 700, (yPos += 30));
                        break;
                }
                break;
            default:
                break;
        }
    }

    vectorMsgTemplate(letter: string, isx: boolean, val: Vector | null, yPos: number) {
        if (isx) this.ctx.fillText(`${letter} x: type or click: [${this.inputBuffer}, ${val ? val.y : 'NaN'}]`, 700, yPos);
        else this.ctx.fillText(`${letter} y: type or click: [${val ? val.x : 'NaN'}, ${this.inputBuffer}]`, 700, yPos);
    }

    clearProperties() {
        if (this.fi === null) return;
        // Entity creation properties
        this.inputBuffer = '';
        this.validInput = false;
        this.cmdState = CmdState.NONE;
        this.subCmd = SubCmd.NONE;
        this.data[this.fi].anchor = { x: 0.5, y: 0.5, z: 0.5 };
        this.data[this.fi].pos = { x: 0, y: 0, z: 0 };
        this.data[this.fi].vel = { x: 0, y: 0, z: 0 };
        this.data[this.fi].size = { x: 10, y: 10, z: 0 };
    }

    preview(delta: number) {
        if (this.ctx !== null) {
            this.entities.forEach((ent, index) => {
                const prevFilter = this.ctx?.filter;
                // show focus
                if (index === this.fi) {
                    this.ctx.filter = 'drop-shadow(4px 4px 0px red)'; // offx, offy, blurRad
                }

                if (this.pause) {
                    ent.tick([], delta);
                }
                ent.draw(this.ctx);
                // draw anchor
                this.ctx.fillStyle = 'green';
                const pos = ent.getPosition;
                this.ctx.fillRect(-2 + pos.x, -2 + pos.y, 4, 4);
                this.ctx.filter = prevFilter;
            });
        }
    }

    selectEntity(e: MouseEvent) {
        if (e.button !== 0) return;

        // check for mouse collision with existing entities
        this.entities.every((ent, index) => {
            if (ent.checkCollisionV(this.mouse)) {
                console.warn('collided');
                this.fi = index;
                return false;
            }
            return true;
        });
    }

    createEntity(data: EntityData, useDefaults = false as boolean) {
        let buffer;
        switch (data.type) {
            case EntityName.Cage:
                if (!useDefaults) buffer = new Cage(data.pos, data.size, data.color);
                else buffer = new Cage(data.pos);
                break;
            case EntityName.HurtBox:
                if (!useDefaults) buffer = new HurtBox(data.pos, data.size, data.color);
                else buffer = new HurtBox(data.pos);
                break;
            case EntityName.Motion:
                if (!useDefaults) buffer = new HurtBoxMotion(data.pos, data.size, data.color);
                else buffer = new HurtBoxMotion(data.pos);

                break;
            case EntityName.Platform:
                if (!useDefaults) buffer = new Platform(data.pos, data.size, data.color);
                else buffer = new Platform(data.pos);
                break;
            case EntityName.Generic:
            default:
                buffer = new GenericObject(data.pos, data.size, data.color);
                break;
        }
        buffer.setVel({ ...data.vel });
        buffer.setAnchor({ ...data.anchor });

        return { entity: buffer, data: useDefaults ? buffer.data : data };
    }

    // automatically takes the current objects settings and translates them to the right
    reloadEntity(i: number) {
        if (this.fi === null) return;
        const { entity, data } = this.createEntity(_.cloneDeep(this.data[i]));
        this.entities[i] = entity;
        this.data[i] = _.cloneDeep(data);
    }

    addEntity(data: EntityData, bump: boolean, addData = true as boolean) {
        if (bump) data.pos.x += data.size.x;
        const result = this.createEntity(_.cloneDeep(data));
        if (bump) data.pos.x -= data.size.x;
        if (addData) this.data.push(result.data);
        this.entities.push(result.entity);
    }

    subEntity() {
        if (this.fi === null) return;
        if (this.entities.length <= 1) return;
        console.log('subEntity');
        // remove entity as index
        this.entities = this.entities.filter((ent, index) => index !== this.fi);
        this.data = this.data.filter((data, index) => index !== this.fi);

        if (this.fi > 0) this.fi -= 1;
    }

    nextEntity() {
        if (this.fi === null) return;
        if (this.data.length - 1 <= this.fi) return;
        console.log('nextEntity');
        this.fi += 1;
    }

    prevEntity() {
        if (this.fi === null) return;
        if (this.fi < 1) return;
        console.log('prevEntity');
        this.fi -= 1;
    }

    save() {
        localStorage.setItem('lastObject', JSON.stringify(this.data));
        console.log('saved:', this.data);
    }

    saveToConsole() {
        console.log(
            JSON.stringify({
                lifetime: 10000,
                position: { x: 0, y: 120, z: 0 },
                entities: this.data,
            })
        );
    }

    reload() {
        for (let i = 0; i < this.data.length; i += 1) this.reloadEntity(i);
    }

    displayGrid() {
        if (!this.showGrid) return;
        this.ctx.beginPath();
        const lw = this.ctx.lineWidth;
        this.ctx.lineWidth = 0.25;
        const h = this.ctx.canvas.height * 0.5 - this.snapToGridY * 0.5;
        const w = this.ctx.canvas.width * 0.5 - this.snapToGridX * 0.5;
        for (let i = this.snapToGridX - this.origin.x; i < w; i += this.snapToGridX) {
            // v
            this.ctx.moveTo(i, this.snapToGridX - this.origin.y);
            this.ctx.lineTo(i, h);
        }
        for (let i = this.snapToGridY - this.origin.y; i < h; i += this.snapToGridY) {
            // v
            this.ctx.moveTo(this.snapToGridY - this.origin.x, i);
            this.ctx.lineTo(w, i);
        }
        // d
        this.ctx.strokeStyle = '#f0f0f0';
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.lineWidth = lw;
    }

    tick(delta: number) {
        if (this.hide) return;

        // A) Update Camera for Entities
        this.ctx.resetTransform(); // Call thing essentially prevents the translate and similar calls from stacking
        // this.ctx.translate(this.cam.x - (this.cam.x % this.snapToGridX), this.cam.y - (this.cam.y % this.snapToGridY));
        this.ctx.translate(this.cam.x, this.cam.y);

        // B) Update Camera Zoom
        this.ctx.scale(this.cam.z, this.cam.z);

        // display
        this.displayGrid();

        // Draw Entities
        this.preview(delta);

        // Draw Origin
        this.ctx.fillStyle = 'gold';
        this.ctx.fillRect(-3, -3, 6, 6);

        // debug mouse
        // Draw Origin
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(this.mouse.x - 2, this.mouse.y - 2, 4, 4);

        // Undo Camera before UI
        this.ctx.translate(-this.cam.x, -this.cam.y);
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // do this specifically for resetting scale

        this.showCommands();
    }

    onScroll(e: WheelEvent) {
        // Zoom in and Out
        this.cam.z -= e.deltaY * 0.001;
    }

    onClick(e: MouseEvent) {
        if (this.fi === null) return;
        switch (this.cmdState) {
            case CmdState.P:
                if (e.button === 0) {
                    let { x, y } = this.mouse;
                    x -= x % this.snapToGridX;
                    y -= y % this.snapToGridY;

                    this.data[this.fi].pos = { x, y, z: this.data[this.fi].pos.z };
                    this.reload();
                    this.save();
                }
                break;
            case CmdState.S:
                if (e.button === 0) {
                    let { x, y } = this.mouse;
                    x -= x % this.snapToGridX;
                    y -= y % this.snapToGridY;
                    x = Math.abs(this.data[this.fi].pos.x - x);
                    y = Math.abs(y - this.data[this.fi].pos.y);
                    this.data[this.fi].size = { x, y, z: this.data[this.fi].pos.z };
                    this.reload();
                    this.save();
                }
                break;
            default:
                break;
        }
    }

    getMousePos(e: MouseEvent): Vector {
        return { x: e.offsetX - this.origin.x, y: e.offsetY - this.origin.y, z: 0 };
    }

    onMouseMove(e: MouseEvent) {
        const x = e.offsetX - this.cam.x;
        const y = e.offsetY - this.cam.y;
        this.mouse = { x: (x * 1) / this.cam.z, y: (y * 1) / this.cam.z, z: 0 };

        this.drag.onMove(e, this.canvas);
        VectorMath.add(this.cam, this.drag.getDragMovement());
    }

    onMouseRelease(e: MouseEvent) {
        if (e.button === 1) {
            this.cam.x = this.origin.x;
            this.cam.y = this.origin.y;
            this.cam.z = this.origin.z;
        }
        this.drag.doDrag(false);
        // VectorMath.add(this.cam, this.drag.getFullDragMovement(true));
        this.drag.doDrop();
    }

    // move entities by dragging them
    // instead of moving them by position, it might be better to move then incrementally
    // dragDrop(e: MouseEvent) { }

    macros(e: KeyboardEvent) {
        // watch for keyboard combinations
        if (e.ctrlKey) {
            switch (e.key) {
                // copy
                case 'c':
                    if (this.fi !== null) this.clipboard = [this.data[this.fi]];
                    break;
                // cut
                case 'x':
                    if (this.fi || this.selected.length) {
                        this.clipboard = [];
                        const hash = {} as IHashMap;
                        this.selected.forEach((s, i) => {
                            // this.clipboard.push(this.data[s]);
                            hash[s] = i;
                        });
                        // filter out cut data and entities
                        // this.data = this.data.filter((d, i) => hash[i] >= 0);
                        console.log({ fi: this.fi, hash });
                        // this.entities = this.entities.filter((d, i) => hash[i] !== undefined);
                        // this.selected = [];
                        // lose focus
                        // this.fi = null;
                    }
                    break;
                // paste
                case 'v':
                    if (this.clipboard.length) {
                        this.clipboard.forEach((d) => {
                            this.addEntity(d, true, true);
                        });
                    }
                    break;
                // select all
                case 'a':
                    if (this.data.length) {
                        this.selected = this.data.map((d, i) => i);
                        this.fi = 0;
                    }
                    break;
                // undo
                case 'z':
                    if (this.history.length) {
                        // get most recent and remove it
                        const first = this.history.shift();
                        this.data = first as EntityData[];
                        // reload entities
                        this.reload();
                    }
                    break;
                default:
                    break;
            }
        } else {
            switch (e.key) {
                // deselect
                case 'Escape':
                    break;
                default:
                    break;
            }
        }
    }
}
