import { MouseDrag } from '../utils';
import { EntityData, EntityName, GenericObject, HurtBox, Platform } from './Game/Entities';
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

    focusedData = {
        type: EntityName.Generic,
        anchor: { x: 0, y: 0, z: 0 },
        pos: { x: 0, y: 0, z: 0 },
        size: { x: 0, y: 0, z: 0 },
        vel: { x: 0, y: 0, z: 0 },
        color: '#333333' as string,
    } as EntityData;

    origin = { x: 0, y: 0, z: 1 } as Vector;

    cam = { x: 0, y: 0, z: 1 } as Vector;

    focusedEntity = null as GenericObject | null;

    entities = [] as GenericObject[];

    data = [] as EntityData[];

    index = 0 as number;

    // states
    snapToGridX = 20 as number; // as in only translate on x or y axis

    snapToGridY = 20 as number; // as in only translate on x or y axis

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
        this.index = 0;
        const d1 = this.data[0];
        const ei = this.entities[0];
        this.focusedData = d1;
        this.focusedEntity = ei;

        // SETUP LISTENER
        window.addEventListener('mouseup', (e) => this.onClick(e));
        window.addEventListener('mouseup', (e) => this.selectEntity(e));
        window.addEventListener('mousedown', () => this.drag.doDrag(true));
        window.addEventListener('mouseup', (e) => this.onMouseRelease(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('wheel', (e) => this.onScroll(e));
        window.addEventListener('keyup', (e) => this.subCommands(e));
        window.addEventListener('keyup', (e) => this.commands(e));
    }

    // destroy and recreate entities from meta data
    loadEntities() {
        this.entities = [];
        // load in all objects
        this.data.forEach((ent) => {
            this.addEntity(ent, false, false);
        });
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
                            this.index = -1;
                            this.save();
                        } else if (this.cmdState === CmdState.NONE) {
                            this.saveToConsole();
                        }
                    } else {
                        this.cmdState = CmdState.Color;
                        this.inputBuffer = this.focusedData.color;
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
        if (this.focusedData.type !== type) {
            this.focusedData.type = type;
            this.reloadEntity(this.index);
            this.save();
        }
    }

    updateCurrentEnity() {
        this.reloadEntity(this.index);
        this.save();
    }

    changeEntityColor(color: string) {
        if (this.focusedData.color !== color) {
            this.focusedData.color = color;
            this.reloadEntity(this.index);
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
                        case 'p':
                            this.changeEntityType(EntityName.Platform);
                            break;
                        case 'H':
                            this.changeEntityType(EntityName.HurtBox);
                            break;
                        case 'M':
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
                            this.addEntity(this.data[this.index], true);
                            this.save();
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
        else {
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
                                            this.focusedData.anchor.x = buffer;
                                            this.subCmd = SubCmd.NONE;
                                            break;
                                        case SubCmd.Y:
                                            this.focusedData.anchor.y = buffer;
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
                                            this.focusedData.size.x = buffer;
                                            this.subCmd = SubCmd.NONE;
                                            break;
                                        case SubCmd.Y:
                                            this.focusedData.size.y = buffer;
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
                                            this.focusedData.vel.x = buffer;
                                            this.subCmd = SubCmd.NONE;
                                            break;
                                        case SubCmd.Y:
                                            this.focusedData.vel.y = buffer;
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
                            this.updateCurrentEnity();
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
        this.ctx.font = '24px Ariel';
        let yPos = 20;
        this.ctx.fillText(`Commands:`, 650, (yPos += 30));
        switch (this.cmdState) {
            case CmdState.NONE:
                {
                    this.ctx.fillText(`F2: Hide F4: Pause(${this.pause}) F8: Grid(${this.showGrid}) Zoom(${Math.trunc(this.cam.z * 100)}%)`, 700, (yPos += 30));
                    this.ctx.fillText(`T: Set Entity Type: ${this.focusedData !== null ? this.focusedData.type : 'NA'}`, 700, (yPos += 30));
                    this.ctx.fillText(`E: Entity Options(${this.index}): ${this.entities.length}|${this.data.length} present`, 700, (yPos += 30));
                    this.ctx.fillText(`A: set Anchor: [${this.focusedData.anchor.x}, ${this.focusedData.anchor.y}]`, 700, (yPos += 30));
                    this.ctx.fillText(`P: set Position: [${this.focusedData.pos.x}, ${this.focusedData.pos.y}]`, 700, (yPos += 30));
                    this.ctx.fillText(`V: set Velocity${this.focusedData.vel ? `: [${this.focusedData.vel.x}, ${this.focusedData.vel.y}]` : ''}`, 700, (yPos += 30));
                    this.ctx.fillText(`S: set Size: [${this.focusedData.size.x}, ${this.focusedData.size.y}]`, 700, (yPos += 30));
                    const prevStyle = this.ctx.fillStyle;
                    this.ctx.fillStyle = this.focusedData.color;
                    this.ctx.fillText(`C: color: ${this.focusedData.color}`, 700, (yPos += 30));
                    this.ctx.fillStyle = prevStyle;
                    this.ctx.fillText(`R: reload`, 700, (yPos += 30));
                    this.ctx.fillText(`C: cancel settings`, 700, (yPos += 30));
                }
                break;
            case CmdState.T:
                switch (this.subCmd) {
                    default:
                        this.ctx.fillText(`T: Platform(P) HurtBox(H) MotionHB(M)`, 700, (yPos += 30));
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
                        this.vectorMsgTemplate('P', true, this.focusedData.anchor, (yPos += 30));
                        break;
                    case SubCmd.Y:
                        this.vectorMsgTemplate('P', false, this.focusedData.anchor, (yPos += 30));
                        break;
                    default:
                        this.ctx.fillText(`A: enter x(X), enter y(Y): [${this.focusedData.anchor.x}, ${this.focusedData.anchor.y}]`, 700, (yPos += 30));
                        break;
                }
                break;
            case CmdState.P:
                switch (this.subCmd) {
                    default:
                        this.ctx.fillText(`P: click to move: [${this.focusedData.pos.x}, ${this.focusedData.pos.y}]`, 700, (yPos += 30));
                        break;
                }
                break;
            case CmdState.S:
                switch (this.subCmd) {
                    case SubCmd.X:
                        this.vectorMsgTemplate('S', true, this.focusedData.size, (yPos += 30));
                        break;
                    case SubCmd.Y:
                        this.vectorMsgTemplate('S', false, this.focusedData.size, (yPos += 30));
                        break;
                    default:
                        this.ctx.fillText(`S: enter x(X), enter y(Y): [${this.focusedData.size.x}, ${this.focusedData.size.y}]`, 700, (yPos += 30));
                        break;
                }
                break;
            case CmdState.V:
                switch (this.subCmd) {
                    case SubCmd.X:
                        this.vectorMsgTemplate('V', true, this.focusedData.vel, (yPos += 30));
                        break;
                    case SubCmd.Y:
                        this.vectorMsgTemplate('V', false, this.focusedData.vel, (yPos += 30));
                        break;
                    default:
                        this.ctx.fillText(`V: enter x(X), enter y(Y): [${this.focusedData.vel.x}, ${this.focusedData.vel.y}]`, 700, (yPos += 30));
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
        // Entity creation properties
        this.inputBuffer = '';
        this.validInput = false;
        this.cmdState = CmdState.NONE;
        this.subCmd = SubCmd.NONE;
        this.focusedData.anchor = { x: 0.5, y: 0.5, z: 0.5 };
        this.focusedData.pos = { x: 0, y: 0, z: 0 };
        this.focusedData.vel = { x: 0, y: 0, z: 0 };
        this.focusedData.size = { x: 10, y: 10, z: 0 };
    }

    preview(delta: number) {
        if (this.ctx !== null) {
            this.entities.forEach((ent) => {
                const prevFilter = this.ctx?.filter;
                // show focus
                if (ent === this.focusedEntity) {
                    this.ctx.filter = 'drop-shadow(4px 4px 0px red)'; // offx, offy, blurRad
                }

                if (this.pause) {
                    ent.tick([], delta);
                }
                ent.draw(this.ctx);
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
                this.index = index;
                this.focusedEntity = ent;
                this.focusedData = this.data[index];
                return false;
            }
            return true;
        });
    }

    createEntity(data: EntityData, useDefaults = false as boolean) {
        let buffer;
        switch (data.type) {
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
        const result = this.createEntity(JSON.parse(JSON.stringify(this.data[i])));
        if (this.focusedEntity === this.entities[i]) this.focusedEntity = result.entity;
        if (this.focusedData === this.data[i]) this.focusedData = result.data;
        this.data[i] = result.data;
        this.entities[i] = result.entity;
    }

    addEntity(data: EntityData, bump: boolean, addData = true as boolean) {
        if (bump) data.pos.x += data.size.x;
        const result = this.createEntity(JSON.parse(JSON.stringify(data)));
        if (bump) data.pos.x -= data.size.x;
        if (addData) this.data.push(result.data);
        this.entities.push(result.entity);
    }

    subEntity() {
        if (this.entities.length <= 1) return;
        console.log('subEntity');
        // remove entity as index
        this.entities = this.entities.filter((ent, index) => index !== this.index);
        this.data = this.data.filter((data, index) => index !== this.index);

        if (this.index > 0) this.index -= 1;
        // point to the same data reference
        this.focusedData = this.data[this.index];
        this.focusedEntity = this.entities[this.index];
    }

    nextEntity() {
        if (this.data.length - 1 <= this.index) return;
        console.log('nextEntity');
        this.index += 1;
        this.focusedEntity = this.entities[this.index];
        // point to the same data reference
        this.focusedData = this.data[this.index];
    }

    prevEntity() {
        if (this.index < 1) return;
        console.log('prevEntity');
        this.index -= 1;
        this.focusedEntity = this.entities[this.index];
        // point to the same data reference
        this.focusedData = this.data[this.index];
    }

    save() {
        localStorage.setItem('lastObject', JSON.stringify(this.data));
        console.log('saved:', this.data);
    }

    saveToConsole() {
        console.log(
            JSON.stringify({
                cage: 2,
                lifetime: 10000,
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
        switch (this.cmdState) {
            case CmdState.P:
                if (e.button === 0) {
                    let { x, y } = this.getMousePos(e);
                    x -= x % this.snapToGridX;
                    y -= y % this.snapToGridY;
                    this.focusedData.pos = { x, y, z: this.focusedData.pos.z };
                    this.reload();
                    this.save();
                }
                break;
            case CmdState.S:
                if (e.button === 0) {
                    let { x, y } = this.getMousePos(e);
                    x = Math.abs(this.focusedData.pos.x - this.getMousePos(e).x);
                    y = Math.abs(this.getMousePos(e).y - this.focusedData.pos.y);
                    this.focusedData.size = { x, y, z: this.focusedData.pos.z };
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
}
