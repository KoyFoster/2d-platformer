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

    hide = false as boolean;

    pause = false as boolean;

    showGrid = false as boolean;

    // Entity creation properties
    inputBuffer: string;

    validInput: boolean;

    cmdState: CmdState;

    subCmd: SubCmd;

    data = {
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

    eData = [] as EntityData[];

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
            // copy over settings of first element
            const first = lastSave[0];
            this.data.anchor = first.anchor;
            this.data.pos = first.pos;
            this.data.size = first.size;
            this.data.vel = first.vel;

            this.eData = lastSave;
            // load in all objects
            this.loadEntities();
        }
        // create initial entity
        else {
            this.data.anchor = { x: 0, y: 0, z: 0.5 };
            this.data.pos = { x: 0, y: 0, z: 0 };
            this.data.size = { x: 10, y: 10, z: 0 };
            this.data.vel = { x: 0, y: 0, z: 0 };

            this.focusedEntity = this.createEntity(this.data);
            this.focusedEntity.setVel({ ...this.data.vel });
            this.focusedEntity.setAnchor({ ...this.data.anchor });

            this.addEntity(
                {
                    type: EntityName.Base,
                    anchor: this.data.anchor,
                    pos: this.data.pos,
                    size: this.data.size,
                    vel: this.data.vel,
                    color: 'white',
                },
                false
            );
        }
        this.data = this.eData[0];

        // SETUP LISTENER
        // Input Listeners
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
        this.eData.forEach((ent) => {
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
                            this.eData = [];
                            this.index = -1;
                            this.save();
                        } else if (this.cmdState === CmdState.NONE) {
                            this.saveToConsole();
                        }
                    } else {
                        this.cmdState = CmdState.Color;
                        this.inputBuffer = this.data.color;
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
        if (this.data.type !== type) {
            this.data.type = type;
            this.entities[this.index] = this.createEntity(this.data);
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
                            this.addEntity(this.eData[this.index], true);
                            this.index = this.entities.length - 1;
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
                                    this.data.color = this.inputBuffer;
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
            console.log(key);
            switch (key) {
                case 'escape':
                    this.subCmd = SubCmd.NONE;
                    break;

                // Apply changes to entity property
                case 'enter':
                    {
                        let change = false;
                        let context = null as Vector | null;
                        switch (this.cmdState) {
                            case CmdState.A:
                                context = this.data.anchor;
                                break;
                            case CmdState.S:
                                context = this.data.size;
                                break;
                            case CmdState.V:
                                context = this.data.vel;
                                break;
                            default:
                                break;
                        } // end of cmd state

                        // check reference
                        if (context === null) {
                            context = { x: 0, y: 0, z: 0 };
                        }
                        buffer = this.getValidInput(true);

                        // validate input
                        if (!Number.isNaN(buffer)) {
                            switch (this.subCmd) {
                                case SubCmd.X:
                                    context.x = buffer;
                                    this.subCmd = SubCmd.NONE;
                                    break;
                                case SubCmd.Y:
                                    context.y = buffer;
                                    this.subCmd = SubCmd.NONE;
                                    break;
                                default:
                                    break;
                            }
                            switch (this.cmdState) {
                                case CmdState.A:
                                    change = true;
                                    this.data.anchor = context;
                                    break;
                                case CmdState.S:
                                    change = true;
                                    this.data.size = context;
                                    break;
                                case CmdState.V:
                                    change = true;
                                    console.log({ x: context.x });
                                    this.data.vel.x = context.x;
                                    console.log(this.index, { x: this.eData[this.index].vel.x });
                                    break;
                                default:
                                    break;
                            }
                        }

                        // on successful update
                        if (change) {
                            this.reload();
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
                    this.ctx.fillText(`F2: Hide F4: Pause(${this.pause}) F8: Grid(${this.showGrid})`, 700, (yPos += 30));
                    this.ctx.fillText(`T: Set Entity Type: ${this.focusedEntity !== null ? this.focusedEntity.type : 'NA'}`, 700, (yPos += 30));
                    this.ctx.fillText(`E: Entity Options(${this.index}): ${this.entities.length}|${this.eData.length} present`, 700, (yPos += 30));
                    this.ctx.fillText(`A: set Anchor: [${this.data.anchor.x}, ${this.data.anchor.y}]`, 700, (yPos += 30));
                    this.ctx.fillText(`P: set Position: [${this.data.pos.x}, ${this.data.pos.y}]`, 700, (yPos += 30));
                    this.ctx.fillText(`V: set Velocity${this.data.vel ? `: [${this.data.vel.x}, ${this.data.vel.y}]` : ''}`, 700, (yPos += 30));
                    this.ctx.fillText(`S: set Size: [${this.data.size.x}, ${this.data.size.y}]`, 700, (yPos += 30));
                    const prevStyle = this.ctx.fillStyle;
                    this.ctx.fillStyle = this.data.color;
                    this.ctx.fillText(`C: color: ${this.data.color}`, 700, (yPos += 30));
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
                        this.vectorMsgTemplate('P', true, this.data.anchor, (yPos += 30));
                        break;
                    case SubCmd.Y:
                        this.vectorMsgTemplate('P', false, this.data.anchor, (yPos += 30));
                        break;
                    default:
                        this.ctx.fillText(`A: enter x(X), enter y(Y): [${this.data.anchor.x}, ${this.data.anchor.y}]`, 700, (yPos += 30));
                        break;
                }
                break;
            case CmdState.P:
                switch (this.subCmd) {
                    default:
                        this.ctx.fillText(`P: click to move: [${this.data.pos.x}, ${this.data.pos.y}]`, 700, (yPos += 30));
                        break;
                }
                break;
            case CmdState.S:
                switch (this.subCmd) {
                    case SubCmd.X:
                        this.vectorMsgTemplate('S', true, this.data.size, (yPos += 30));
                        break;
                    case SubCmd.Y:
                        this.vectorMsgTemplate('S', false, this.data.size, (yPos += 30));
                        break;
                    default:
                        this.ctx.fillText(`S: enter x(X), enter y(Y): [${this.data.size.x}, ${this.data.size.y}]`, 700, (yPos += 30));
                        break;
                }
                break;
            case CmdState.V:
                switch (this.subCmd) {
                    case SubCmd.X:
                        this.vectorMsgTemplate('V', true, this.data.vel, (yPos += 30));
                        break;
                    case SubCmd.Y:
                        this.vectorMsgTemplate('V', false, this.data.vel, (yPos += 30));
                        break;
                    default:
                        this.ctx.fillText(`V: enter x(X), enter y(Y): [${this.data.vel.x}, ${this.data.vel.y}]`, 700, (yPos += 30));
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
        this.data.anchor = { x: 0.5, y: 0.5, z: 0.5 };
        this.data.pos = { x: 0, y: 0, z: 0 };
        this.data.vel = { x: 0, y: 0, z: 0 };
        this.data.size = { x: 10, y: 10, z: 0 };
    }

    preview(delta: number) {
        if (this.ctx !== null) {
            this.entities.forEach((ent) => {
                const prevFilter = this.ctx?.filter;
                // show focus
                if (ent === this.focusedEntity) {
                    this.ctx.filter = 'drop-shadow(4px 4px 0px red)'; // offx, offy, blurRad
                }

                if (this.pause) ent.tick([], delta);
                ent.draw(this.ctx);
                this.ctx.filter = prevFilter;
            });
        }
    }

    selectEntity(e: MouseEvent) {
        if (e.button !== 0) return;

        // mouse pos relative to space
        const pos = { x: e.offsetX - this.cam.x, y: e.offsetY - this.cam.y, z: 0 } as Vector;

        console.log({ ...pos });

        // check for mouse collision with existing entities
        this.entities.every((ent, index) => {
            if (ent.checkCollisionV(pos)) {
                this.index = index;
                this.focusedEntity = ent;
                this.data = this.eData[index];
                return false;
            }
            return true;
        });
    }

    createEntity(data: EntityData): GenericObject {
        let buffer;
        switch (data.type) {
            case EntityName.HurtBox:
                buffer = new HurtBox(data.pos, data.size, data.color);
                buffer.setVel({ ...data.vel });
                buffer.setAnchor({ ...data.anchor });
                break;
            case EntityName.Motion:
                buffer = new HurtBoxMotion(data.pos, data.size, data.color);
                buffer.setVel({ ...data.vel });
                buffer.setAnchor({ ...data.anchor });
                break;
            case EntityName.Platform:
                buffer = new Platform(data.pos);
                data.pos = { ...buffer.data.pos };
                data.anchor = { ...buffer.data.anchor };
                data.size = { ...buffer.data.size };
                data.vel = { ...buffer.data.vel };
                data.color = buffer.data.color;
                break;
            case EntityName.Generic:
            default:
                buffer = new GenericObject(data.pos, data.size, data.color);
                break;
        }

        return buffer;
    }

    // automatically takes the current objects settings and translates them to the right
    addEntity(data: EntityData, bump: boolean, addData = true as boolean) {
        console.log('addEntity');
        let d = data;
        if (addData) {
            d = { ...data };
            if (bump) d.pos.x += d.size.x;
            this.eData.push(d);
            // point to the same data reference
            this.eData[this.index] = d;
            this.data = d;
        }

        this.focusedEntity = this.createEntity(d);
        this.entities.push(this.focusedEntity);
    }

    subEntity() {
        if (this.entities.length <= 1) return;
        console.log('subEntity');
        // remove entity as index
        this.entities = this.entities.filter((ent, index) => index !== this.index);
        this.eData = this.eData.filter((data, index) => index !== this.index);

        if (this.index > 0) this.index -= 1;
        // point to the same data reference
        this.data = this.eData[this.index];
        this.focusedEntity = this.entities[this.index];

        this.save();
    }

    nextEntity() {
        if (this.eData.length - 1 <= this.index) return;
        console.log('nextEntity');
        this.index += 1;
        this.focusedEntity = this.entities[this.index];
        // point to the same data reference
        this.data = this.eData[this.index];
    }

    prevEntity() {
        if (this.index < 1) return;
        console.log('prevEntity');
        this.index -= 1;
        this.focusedEntity = this.entities[this.index];
        // point to the same data reference
        this.data = this.eData[this.index];
    }

    save() {
        localStorage.setItem('lastObject', JSON.stringify(this.eData));
        console.log('saved:', this.eData);
    }

    saveToConsole() {
        console.log(
            JSON.stringify({
                cage: 2,
                lifetime: 10000,
                entities: this.eData,
            })
        );
    }

    reload() {
        this.loadEntities();
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
        this.ctx.translate(this.cam.x - (this.cam.x % this.snapToGridX), this.cam.y - (this.cam.y % this.snapToGridY));
        // this.ctx.translate(this.cam.x, this.cam.y);

        // B) Update Camera Zoom
        this.ctx.scale(this.cam.z, this.cam.z);

        // display
        this.displayGrid();

        // Draw Entities
        this.preview(delta);

        // Draw Origin
        this.ctx.fillStyle = 'gold';
        this.ctx.fillRect(-3, -3, 6, 6);

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
                    console.log({ x, y });
                    this.data.pos = { x, y, z: this.data.pos.z };
                    this.reload();
                    this.save();
                }
                break;
            case CmdState.S:
                if (e.button === 0) {
                    let { x, y } = this.getMousePos(e);
                    x = Math.abs(this.data.pos.x - this.getMousePos(e).x);
                    y = Math.abs(this.getMousePos(e).y - this.data.pos.y);
                    console.log({ x, y });
                    this.data.size = { x, y, z: this.data.pos.z };
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
