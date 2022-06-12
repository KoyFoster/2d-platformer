import _, { toNumber } from 'lodash';
import { IHashMap, LocalStorageHandler as LSH, MouseDrag } from '../utils';
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

    selected = [] as number[];

    selectedHashMap = {} as IHashMap;

    origin = { x: 0, y: 0, z: 1 } as Vector;

    cam = { x: 0, y: 0, z: 1 } as Vector;

    entities = [] as GenericObject[];

    data = [] as EntityData[];

    clipboard = [] as EntityData[];

    history = [] as EntityData[][]; // saves deep states of all major changes

    future = [] as EntityData[][]; // saves deep states of all undone changes

    // states
    snapToGridX = 10 as number; // as in only translate on x or y axis

    snapToGridY = 10 as number; // as in only translate on x or y axis

    camDrag = new MouseDrag() as MouseDrag;

    entDrag = new MouseDrag() as MouseDrag;

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, defaultCam: Vector, origin: Vector) {
        this.canvas = canvas;
        this.ctx = ctx;
        if (defaultCam) {
            this.origin = origin;
            this.cam = defaultCam;
        }
        // load last save
        const saveData = LSH.Load('saveData') as EntityData[] | null;
        const editHistory = LSH.Load('editHistory') as EntityData[][] | null;
        const editFuture = LSH.Load('editFuture') as EntityData[][] | null;
        if (editHistory) this.history = editHistory;
        if (editFuture) this.future = editFuture;

        const hide = localStorage.getItem('hideDev');
        if (hide && hide === 'true') this.hide = true;
        const pause = localStorage.getItem('pauseDev');
        if (pause && pause === 'true') this.pause = true;
        const showGrid = localStorage.getItem('showGrid');
        if (showGrid && showGrid === 'true') this.showGrid = true;

        console.log({ saveData, editHistory, editFuture });

        // Entity creation properties
        this.inputBuffer = '';
        this.validInput = false;
        this.cmdState = CmdState.NONE;
        this.subCmd = SubCmd.NONE;

        if (saveData !== null && saveData.length > 0) {
            this.data = saveData;
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

        // SETUP LISTENER
        window.addEventListener('mouseup', (e) => this.onClickUp(e));
        window.addEventListener('mousedown', (e) => this.beginDrag(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('wheel', (e) => this.onScroll(e));

        window.addEventListener('keyup', (e) => this.commands(e));
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

    reload() {
        console.log('reload');
        this.loadEntities();
    }

    // specify an already potentially selected element for focus
    setFocus(i: number) {
        // remove from hashmap
        if (this.selectedHashMap[i]) {
            this.selected = this.selected.filter((s) => s !== i);
            delete this.selectedHashMap[i];
        } else {
            this.selectedHashMap[i] = 1;
        }
        // set to start of selected
        this.selected.unshift(i);
    }

    // set single selection
    setSelected(i: number) {
        // set to start of selected
        this.selected = [i];
        this.selectedHashMap = {};
        this.selectedHashMap[i] = 1;
    }

    get focused(): { i: number; d: EntityData; e: GenericObject } | null {
        if (!this.selected.length) return null;
        return { i: this.selected[0], d: this.data[this.selected[0]], e: this.entities[this.selected[0]] };
    }

    // set group selection
    setSelection(sel: number[]) {
        this.selected = sel;
        // update hashmap
        this.selectedHashMap = {};
        this.selected.forEach((s) => {
            this.selectedHashMap[s] = 1;
        });
    }

    addSelected(i: number) {
        // add to the begining of the list, so that is is focused
        if (this.selectedHashMap[i]) this.selected = this.selected.filter((s) => s !== i);

        this.selected.unshift(i);
        this.selectedHashMap[i] = 1;
    }

    selectAll() {
        console.log('-selectAll-');
        this.selectedHashMap = {};
        this.selected = this.data.map((_d, i) => {
            this.selectedHashMap[i] = 1;
            return i;
        });
    }

    deselect() {
        this.selected = [];
        this.selectedHashMap = {};
        // console.log('-deselect-', this.data, this.entities);
    }

    isSelected(i: number): boolean {
        return !!this.selectedHashMap[i];
    }

    promptForChange(property: string, key: keyof EntityData) {
        if (this.focused) {
            const data = this.focused.d[key] as Vector;
            let x = window.prompt(`Enter x ${property}`, data.x.toString(10)) as number | string | null;
            if (x !== null) x = toNumber(x);
            let y = window.prompt(`Enter y ${property}`, data.y.toString(10)) as number | string | null;
            if (y !== null) y = toNumber(y);

            if (((x !== null || y !== null) && x !== data.x) || y !== data.y) {
                this.appendToHistory();
                const value = { x: x !== null ? x : data.x, y: y !== null ? y : data.y, z: data.z } as Vector;
                this.changeEntityProperty(value, key);
            }
        }
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

        // drag states release
        this.entDrag.setHorizDrag = false;
        this.entDrag.setVertDrag = false;
    }

    getValidInput(clear = false as boolean): number {
        let result = 0 as number;
        result = Number(this.inputBuffer);
        this.validInput = !Number.isNaN(result);
        if (this.validInput && clear) this.inputBuffer = '';
        return result;
    }

    // this should be called before a major change is made
    private appendToHistory = () => {
        console.log('appendToHistory');
        this.history.unshift(_.cloneDeep(this.data));
        this.future = [];
    };

    undoFuture() {
        if (this.history.length) {
            // remove from history
            const first = this.history.shift();
            // prepend to future with present
            this.future.unshift(_.cloneDeep(this.data) as EntityData[]);
            // apply history to present
            this.data = first as EntityData[];
            // reload entities
            this.loadEntities();
            // console.log('UF', { data: this.data, history: this.history, future: this.future });
        }
    }

    redoHistory() {
        console.log('redoHistory');
        if (this.future.length) {
            // remove from future
            const first = this.future.shift();
            // prepend to history with present
            this.history.unshift(_.cloneDeep(this.data) as EntityData[]);
            // apply history to present
            this.data = first as EntityData[];
            // reload entities
            this.loadEntities();
            // console.log('UH', { data: this.data, history: this.history, future: this.future });
        }
    }

    reloadFocused() {
        if (this.focused !== null) {
            this.reloadEntity(this.focused.i);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    changeEntityProperty(value: any, key: keyof EntityData) {
        console.log('changeEntityProperty:', { value, key });
        if (this.selected.length) {
            this.selected.forEach((s) => {
                const d = this.data[s] as EntityData;
                d[key] = value;
            });

            this.reload();
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

    showInfo() {
        this.ctx.font = '24px Ariel';
        let yPos = 20;
        this.ctx.fillText(`Commands:`, 650, (yPos += 30));
        this.ctx.fillText(`F2: Hide F4: Pause(${this.pause}) F8: Grid(${this.showGrid}) Zoom(${Math.trunc(this.cam.z * 100)}%)`, 700, (yPos += 30));

        if (this.focused !== null) {
            this.ctx.fillText(` - Add(T): HB(S1) HBM(S2) Pl{S3} GB(S4)`, 700, (yPos += 30));
            this.ctx.fillText(` - Type(T): ${this.focused.d.type}`, 700, (yPos += 30));
            this.ctx.fillText(` - Position(P): [${this.focused.d.pos.x}, ${this.focused.d.pos.y}] Anchor(A): [${this.focused.d.anchor.x}, ${this.focused.d.anchor.y}]`, 700, (yPos += 30));
            this.ctx.fillText(` - Size(S): [${this.focused.d.size.x}, ${this.focused.d.size.y}] Velocity(V)${this.focused.d.vel ? `: [${this.focused.d.vel.x}, ${this.focused.d.vel.y}]` : ''}`, 700, (yPos += 30));

            const prevStyle = this.ctx.fillStyle;
            this.ctx.fillStyle = this.focused.d.color;
            this.ctx.fillText(` - Color: ${this.focused.d.color}`, 700, (yPos += 30));
            this.ctx.fillStyle = prevStyle;
        }
        this.ctx.fillText(`Reload(R)`, 700, (yPos += 30));
    }

    vectorMsgTemplate(letter: string, isx: boolean, val: Vector | null, yPos: number) {
        if (isx) this.ctx.fillText(`${letter} x: type or click: [${this.inputBuffer}, ${val ? val.y : 'NaN'}]`, 700, yPos);
        else this.ctx.fillText(`${letter} y: type or click: [${val ? val.x : 'NaN'}, ${this.inputBuffer}]`, 700, yPos);
    }

    clearProperties() {
        if (this.focused === null) return;
        // Entity creation properties
        this.inputBuffer = '';
        this.validInput = false;
        this.cmdState = CmdState.NONE;
        this.subCmd = SubCmd.NONE;
        this.focused.d.anchor = { x: 0.5, y: 0.5, z: 0.5 };
        this.focused.d.pos = { x: 0, y: 0, z: 0 };
        this.focused.d.vel = { x: 0, y: 0, z: 0 };
        this.focused.d.size = { x: 10, y: 10, z: 0 };
    }

    renderEntities(delta: number) {
        if (this.ctx !== null) {
            this.entities.forEach((ent, i) => {
                const prevFilter = this.ctx?.filter;
                // show focus
                if (this.focused && i === this.focused.i) {
                    this.ctx.filter = 'drop-shadow(4px 4px 0px red)'; // offx, offy, blurRad
                } else if (this.isSelected(i)) {
                    this.ctx.filter = 'drop-shadow(4px 4px 0px green)'; // offx, offy, blurRad
                }

                if (!this.pause) {
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
        if (this.entDrag.isDragging) return;

        // check for mouse collision with existing entities
        let selected = false;
        this.entities.every((ent, index) => {
            if (ent.checkCollisionV(this.mouse)) {
                if (e.ctrlKey) this.addSelected(index);
                else this.setSelected(index);
                selected = true;
                return false;
            }
            return true;
        });
        if (!selected) this.deselect();
    }

    createEntity(data: EntityData, useDefaults = false as boolean) {
        let buffer;
        switch (data.type) {
            case EntityName.Cage:
                if (!useDefaults) buffer = new Cage(data.pos as Vector, data.size, data.color);
                else buffer = new Cage(data.pos as Vector);
                break;
            case EntityName.HurtBox:
                if (!useDefaults) buffer = new HurtBox(data.pos as Vector, data.size, data.color);
                else buffer = new HurtBox(data.pos as Vector);
                break;
            case EntityName.Motion:
                if (!useDefaults) buffer = new HurtBoxMotion(data.pos as Vector, data.size, data.color);
                else buffer = new HurtBoxMotion(data.pos as Vector);
                break;
            case EntityName.Platform:
                if (!useDefaults) buffer = new Platform(data.pos, data.size, data.color);
                else buffer = new Platform(data.pos as Vector);
                break;
            case EntityName.Generic:
            default:
                buffer = new GenericObject(data.pos as Vector, data.size as Vector, data.color as string);
                break;
        }
        if (data.vel) buffer.setVel({ ...data.vel });
        if (data.anchor) buffer.setAnchor({ ...data.anchor });

        return { entity: buffer, data: useDefaults ? buffer.data : data };
    }

    // automatically takes the current objects settings and translates them to the right
    reloadEntity(i: number) {
        if (this.focused === null) return;
        const { entity, data } = this.createEntity(_.cloneDeep(this.data[i]));
        this.entities[i] = entity;
        this.data[i] = _.cloneDeep(data);
    }

    addEntity(data: EntityData, bump: boolean, addData = true as boolean) {
        if (bump) data.pos.x += data.size.x;
        const result = this.createEntity(_.cloneDeep(data));
        if (bump) data.pos.x -= data.size.x;
        if (addData) {
            this.data.push(result.data);
            if (bump) this.setSelected(this.data.length - 1);
        }
        this.entities.push(result.entity);
    }

    addNewEntity(type: EntityName, pos: Vector) {
        console.log('addNewEntity:', { type, pos });
        const result = this.createEntity({ type, pos }, true);
        this.data.push(result.data);
        this.entities.push(result.entity);
    }

    nextEntity() {
        if (this.data.length === 0) return;
        if (this.focused === null || this.focused.i === this.data.length - 1) {
            this.setSelected(0);
            return;
        }
        this.setSelected(this.focused.i + 1);
    }

    prevEntity() {
        if (this.data.length === 0) return;
        if (this.focused === null || this.focused.i === 0) {
            this.setSelected(this.data.length - 1);
            return;
        }
        this.setSelected(this.focused.i - 1);
    }

    save() {
        localStorage.setItem('editHistory', JSON.stringify(this.history));
        localStorage.setItem('editFuture', JSON.stringify(this.future));
        localStorage.setItem('saveData', JSON.stringify(this.data));
        console.log('-saved-');
    }

    clearAll() {
        console.log('-clearAll-');
        this.entities = [];
        this.data = [];
        this.selected = [];
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

    displayGrid() {
        if (!this.showGrid) return;
        this.ctx.beginPath();
        const lw = this.ctx.lineWidth;
        this.ctx.lineWidth = 1;
        const scale = this.cam.z;
        const xGap = this.snapToGridX * 2;
        const yGap = this.snapToGridY * 2;
        const h = ((this.ctx.canvas.height - this.snapToGridY) * 0.5) / scale;
        const w = ((this.ctx.canvas.width - this.snapToGridX) * 0.5) / scale;
        let x = (xGap - this.origin.y) / scale;
        let y = (yGap - this.origin.x) / scale;
        x -= x % xGap;
        y -= y % yGap;

        for (let i = y; i < w; i += xGap) {
            // v
            // draw every other line
            this.ctx.moveTo(i, x);
            this.ctx.lineTo(i, h);
        }
        for (let i = x; i < h; i += yGap) {
            // v
            // draw every other line
            this.ctx.moveTo(y, i);
            this.ctx.lineTo(w, i);
        }
        // d
        this.ctx.strokeStyle = '#444444';
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
        this.renderEntities(delta);

        // Draw Origin
        this.ctx.fillStyle = 'gold';
        this.ctx.fillRect(-3, -3, 6, 6);

        // Draw Mouse
        this.ctx.fillStyle = 'red';
        if (this.entDrag.isVertDrag) this.ctx.fillRect(this.mouse.x - 1, this.mouse.y - 80, 2, 160);
        else if (this.entDrag.isHorizDrag) this.ctx.fillRect(this.mouse.x - 80, this.mouse.y - 1, 160, 2);
        else this.ctx.fillRect(this.mouse.x - 2, this.mouse.y - 2, 4, 4);

        // Undo Camera before UI
        this.ctx.translate(-this.cam.x, -this.cam.y);
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // do this specifically for resetting scale

        this.showInfo();
    }

    onScroll(e: WheelEvent) {
        // Zoom in and Out
        this.cam.z -= e.deltaY * 0.001;
        // prevent zooming out too much
        if (this.cam.z <= 0.1) this.cam.z = 0.1;
    }

    onClickUp(e: MouseEvent) {
        this.selectEntity(e);
        this.onMouseRelease(e);
    }

    applySnap(v: Vector) {
        return { x: v.x - (v.x % this.snapToGridX), y: v.y - (v.y % this.snapToGridY), z: v.z };
    }

    getMousePos(e: MouseEvent): Vector {
        return { x: e.offsetX - this.origin.x, y: e.offsetY - this.origin.y, z: 0 };
    }

    beginDrag(e: MouseEvent) {
        // left click
        if (e.button === 0 && this.selected.length) {
            this.entDrag.doDrag(true);
        }
        // middle mouse
        if (e.button === 1) this.camDrag.doDrag(true);
    }

    onMouseMove(e: MouseEvent) {
        const x = e.offsetX - this.cam.x;
        const y = e.offsetY - this.cam.y;
        // calculate mouse positions relativity
        this.mouse = { x: (x * 1) / this.cam.z, y: (y * 1) / this.cam.z, z: 0 };
        this.camDrag.setHorizDrag = e.shiftKey;
        this.camDrag.setVertDrag = e.ctrlKey;

        this.camDrag.onMove(e, this.canvas, { x: e.offsetX, y: e.offsetY, z: 0 });
        VectorMath.add(this.cam, this.camDrag.getDragMovement());

        // if move is currently colliding the focused element and in dragging state
        if (this.focused) {
            if (this.entDrag.dragging || this.focused.e.checkCollisionV(this.mouse)) {
                const point = { ...this.applySnap(this.mouse) };

                this.entDrag.onMove(e, this.canvas, this.applySnap(point), this.appendToHistory);

                if (this.entDrag.dragging) {
                    const movement = this.entDrag.getDragMovement();
                    // drag
                    if (!e.altKey) {
                        this.selected.forEach((i) => {
                            const d = this.data[i];
                            const ent = this.entities[i];
                            VectorMath.add(d.pos, movement);
                            ent.setPos({ ...d.pos });
                        });
                    }
                    // resize
                    else {
                        this.selected.forEach((i) => {
                            const d = this.data[i];
                            const ent = this.entities[i];
                            VectorMath.add(d.size, { x: -movement.x, y: movement.y, z: movement.z });
                            ent.setSize({ ...d.size });
                        });
                    }
                }
            }
        }
    }

    resetCamera() {
        this.cam.x = this.origin.x;
        this.cam.y = this.origin.y;
        this.cam.z = this.origin.z;
    }

    onMouseRelease(e: MouseEvent) {
        if (e.button === 0) {
            this.entDrag.doDrag(false);
            this.entDrag.doDrop();
        }
        if (e.button === 1) {
            this.camDrag.doDrag(false);
            this.camDrag.doDrop();
        }
    }

    deleteSelected() {
        this.data = this.data.filter((_d, i) => !this.selectedHashMap[i]);
        this.entities = this.entities.filter((_e, i) => !this.selectedHashMap[i]);
        // lose focus
        this.deselect();
    }

    addSelectedToClipboard() {
        this.clipboard = [];
        this.selected.forEach((s) => {
            this.clipboard.push(this.data[s]);
        });
        // filter out cut data and entities
        console.log('clipboard:', this.clipboard);
    }

    macros(e: KeyboardEvent) {
        // watch for keyboard combinations
        if (e.ctrlKey) {
            switch (e.key) {
                // copy
                case 'c':
                    if (this.focused !== null) this.clipboard = [this.focused.d];
                    break;
                // copy to console
                case 'C':
                    e.preventDefault();
                    this.saveToConsole();
                    break;
                // cut
                case 'x':
                    if (this.selected.length) {
                        this.appendToHistory();
                        this.addSelectedToClipboard();
                        this.deleteSelected();
                    }
                    break;
                // paste
                case 'v':
                    if (this.clipboard.length) {
                        this.appendToHistory();
                        this.clipboard.forEach((d) => {
                            this.addEntity(d, true, true);
                        });
                    }
                    break;
                // select all
                case 'a':
                    this.selectAll();
                    break;
                // undo
                case 'z':
                    this.undoFuture();
                    break;
                case 'Z':
                    this.redoHistory();
                    break;
                case 's':
                    if (e.ctrlKey) {
                        e.preventDefault();

                        this.saveToConsole();
                        this.save();
                    }
                    break;
                case 'd':
                    if (e.ctrlKey && e.shiftKey) {
                        e.preventDefault();
                        this.clearAll();
                    }
                    break;
                default:
                    break;
            }
        } else {
            switch (e.key) {
                // deselect
                case 'Escape':
                    this.deselect();
                    break;
                // cut
                case 'Delete':
                    if (this.selected.length) {
                        this.appendToHistory();
                        this.deleteSelected();
                    }
                    break;
                case 'Tab':
                    e.preventDefault();
                    if (e.shiftKey) this.prevEntity();
                    else this.nextEntity();
                    break;
                case 'C':
                    if (this.focused) {
                        let validColor = false as boolean;
                        let buffer = '' as string | null;
                        while (validColor === false && buffer !== null) {
                            buffer = window.prompt('Enter Color', this.focused.d.color);
                            // validate color
                            if (buffer !== null) {
                                const lastStyle = this.ctx.fillStyle;
                                this.ctx.fillStyle = buffer;

                                if (this.ctx.fillStyle === buffer) {
                                    this.appendToHistory();
                                    this.changeEntityProperty(buffer, 'color');
                                    validColor = true;
                                } else alert('invalid color');
                                this.ctx.fillStyle = lastStyle;
                            }
                        }
                    }
                    break;
                case 'A':
                    this.promptForChange('anchor', 'anchor');
                    break;
                case 'P':
                    this.promptForChange('position', 'pos');
                    break;
                case 'V':
                    this.promptForChange('velocity', 'vel');
                    break;
                case 'S':
                    this.promptForChange('size', 'size');
                    break;
                case 'R':
                    this.reload();
                    break;

                // add entities
                case '!':
                    this.addNewEntity(EntityName.HurtBox, this.applySnap(this.mouse));
                    this.appendToHistory();
                    break;
                case '@':
                    this.addNewEntity(EntityName.Motion, this.applySnap(this.mouse));
                    this.appendToHistory();
                    break;
                case '#':
                    this.addNewEntity(EntityName.Platform, this.applySnap(this.mouse));
                    this.appendToHistory();
                    break;
                case '$':
                    this.addNewEntity(EntityName.Blaster, this.applySnap(this.mouse));
                    this.appendToHistory();
                    break;
                default:
                    break;
            }
        }
        // drag states
        this.entDrag.setHorizDrag = e.shiftKey;
        this.entDrag.setVertDrag = e.ctrlKey;
    }
}
