import { EntityData, EntityName, GenericObject, HurtBox, Platform } from './Game/Entities';
import { HurtBoxMotion } from './Game/Entities/objects/HurtBoxMotion';
import { Vector } from './Game/Lib';

enum CmdState {
    T,
    E,
    A,
    P,
    S,
    V,
    C,
    Cam,
    NONE,
}
enum SubCmd {
    X,
    Y,
    Add,
    Sub,
    Prev,
    Next,
    NONE,
}

export class DevTools {
    hide = false as boolean;

    pause = false as boolean;

    // Entity creation properties
    inputBuffer: string;

    validInput: boolean;

    cmdState: CmdState;

    subCmd: SubCmd;

    anchor: Vector;

    cam = { x: 0, y: 0, z: 0 } as Vector;

    pos: Vector;

    vel: Vector;

    size: Vector;

    type = EntityName.Generic as EntityName;

    focusedEntity = null as GenericObject | null;

    entities = [] as GenericObject[];

    data = [] as EntityData[];

    index = -1 as number;

    // states
    snapToGridX = 10 as number; // as in only translate on x or y axis

    snapToGridY = 10 as number; // as in only translate on x or y axis

    constructor(offset: Vector) {
        let lastObject = localStorage.getItem('lastObject') as EntityData[] | string | null;
        lastObject = lastObject ? (JSON.parse(lastObject as string) as EntityData[]) : ([] as EntityData[]);

        const hide = localStorage.getItem('hideDev');
        if (hide && hide === 'true') this.hide = true;
        const pause = localStorage.getItem('pauseDev');
        if (pause && pause === 'true') this.pause = true;

        // Entity creation properties
        this.inputBuffer = '';
        this.validInput = false;
        this.cmdState = CmdState.NONE;
        this.subCmd = SubCmd.NONE;

        if (lastObject.length > 0) {
            // copy over settings of first element
            const first = lastObject[0];
            this.anchor = first.anchor;
            this.pos = first.pos;
            this.size = first.size;
            this.vel = first.vel;

            // load in all objects
            lastObject.forEach((ent) => {
                this.addEntity(ent, false);
            });
        }
        // create initial entity
        else {
            this.anchor = { x: 0.5, y: 0.5, z: 0.5 };
            this.pos = { x: 0, y: 0, z: 0 };
            this.size = { x: 10, y: 10, z: 0 };
            this.vel = { x: 0, y: 0, z: 0 };

            this.focusedEntity = this.createEntity(this.type, { ...this.pos }, { ...this.size }, 'green');
            this.focusedEntity.setVel({ ...this.vel });
            this.focusedEntity.setAnchor({ ...this.anchor });
            this.data.push();

            this.addEntity(
                {
                    type: EntityName.Base,
                    anchor: this.anchor,
                    pos: this.pos,
                    size: this.size,
                    vel: this.vel,
                    color: 'white',
                },
                false
            );
        }

        // SETUP LISTENER
        // Input Listeners
        window.addEventListener('mouseup', (e) => this.onClick(e, offset));
        window.addEventListener('keyup', (e) => this.commands(e));
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
                    this.updatePreview();
                    break;
                case 'c':
                    if (e.shiftKey) {
                        if (this.cmdState === CmdState.NONE) {
                            this.saveToFile();
                        }
                    } else this.cmdState = CmdState.Cam;
                    break;
                case 'enter':
                case 'escape':
                    break;
                default:
                    break;
            }

        this.subCommands(e);
    }

    getValidInput(clear = false as boolean): number {
        let result = 0 as number;
        result = Number(this.inputBuffer);
        this.validInput = !Number.isNaN(result);
        if (this.validInput && clear) this.inputBuffer = '';
        return result;
    }

    changeEntityType(type: EntityName) {
        if (this.type !== type) {
            this.type = type;
            this.entities[this.index] = this.createEntity(type, this.pos, this.size, 'white');
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
                            break;
                        case '-':
                            this.subEntity();
                            break;
                        case 'arrowright':
                            this.nextEntity();
                            break;
                        case 'arrowleft':
                            this.prevEntity();
                            break;
                        case 'escape':
                            this.cmdState = CmdState.NONE;
                            break;
                        default:
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
                case CmdState.Cam:
                    switch (key) {
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
                                context = this.anchor;
                                break;
                            case CmdState.P:
                                context = this.pos;
                                break;
                            case CmdState.S:
                                context = this.size;
                                break;
                            case CmdState.V:
                                context = this.vel;
                                break;
                            default:
                                break;
                        }

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
                                    this.anchor = context;
                                    break;
                                case CmdState.P:
                                    change = true;
                                    this.pos = context;
                                    break;
                                case CmdState.S:
                                    change = true;
                                    this.size = context;
                                    break;
                                case CmdState.V:
                                    change = true;
                                    this.vel = context;
                                    break;
                                default:
                                    break;
                            }
                        }

                        // on successful update, reset preview
                        if (change) this.updatePreview();
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

    showCommands(ctx: CanvasRenderingContext2D) {
        if (ctx === null) return;
        ctx.font = '24px Ariel';
        let yPos = 20;
        ctx.fillText(`Commands:`, 650, (yPos += 30));
        switch (this.cmdState) {
            case CmdState.NONE:
                ctx.fillText(`T: Set Entity Type: ${this.focusedEntity !== null ? this.focusedEntity.type : 'NA'} present`, 700, (yPos += 30));
                ctx.fillText(`E: Entity Options: ${this.entities.length} present`, 700, (yPos += 30));
                ctx.fillText(`A: set Anchor: [${this.anchor.x}, ${this.anchor.y}]`, 700, (yPos += 30));
                ctx.fillText(`P: set Position: [${this.pos.x}, ${this.pos.y}]`, 700, (yPos += 30));
                ctx.fillText(`V: set Velocity${this.vel ? `: [${this.vel.x}, ${this.vel.y}]` : ''}`, 700, (yPos += 30));
                ctx.fillText(`S: set Size: [${this.size.x}, ${this.size.y}]`, 700, (yPos += 30));
                ctx.fillText(`R: reload preview`, 700, (yPos += 30));
                ctx.fillText(`C: cancel settings`, 700, (yPos += 30));
                ctx.fillText(`c: move camera`, 700, (yPos += 30));
                break;
            case CmdState.T:
                switch (this.subCmd) {
                    default:
                        ctx.fillText(`T: Platform(P) HurtBox(H) MotionHB(M)`, 700, (yPos += 30));
                        break;
                }
                break;
            case CmdState.E:
                switch (this.subCmd) {
                    default:
                        ctx.fillText(`E: add(+) sub(-) prev(<-) next(->)`, 700, (yPos += 30));
                        break;
                }
                break;
            case CmdState.A:
                switch (this.subCmd) {
                    case SubCmd.X:
                        this.vectorMsgTemplate(ctx, 'P', true, this.anchor, (yPos += 30));
                        break;
                    case SubCmd.Y:
                        this.vectorMsgTemplate(ctx, 'P', false, this.anchor, (yPos += 30));
                        break;
                    default:
                        ctx.fillText(`A: enter x(X), enter y(Y): [${this.anchor.x}, ${this.anchor.y}]`, 700, (yPos += 30));
                        break;
                }
                break;
            case CmdState.P:
                switch (this.subCmd) {
                    case SubCmd.X:
                        this.vectorMsgTemplate(ctx, 'P', true, this.pos, (yPos += 30));
                        break;
                    case SubCmd.Y:
                        this.vectorMsgTemplate(ctx, 'P', false, this.pos, (yPos += 30));
                        break;
                    default:
                        ctx.fillText(`P: enter x(X), enter y(Y): [${this.pos.x}, ${this.pos.y}]`, 700, (yPos += 30));
                        break;
                }
                break;
            case CmdState.S:
                switch (this.subCmd) {
                    case SubCmd.X:
                        this.vectorMsgTemplate(ctx, 'S', true, this.size, (yPos += 30));
                        break;
                    case SubCmd.Y:
                        this.vectorMsgTemplate(ctx, 'S', false, this.size, (yPos += 30));
                        break;
                    default:
                        ctx.fillText(`S: enter x(X), enter y(Y): [${this.size.x}, ${this.size.y}]`, 700, (yPos += 30));
                        break;
                }
                break;
            case CmdState.V:
                switch (this.subCmd) {
                    case SubCmd.X:
                        this.vectorMsgTemplate(ctx, 'V', true, this.vel, (yPos += 30));
                        break;
                    case SubCmd.Y:
                        this.vectorMsgTemplate(ctx, 'V', false, this.vel, (yPos += 30));
                        break;
                    default:
                        ctx.fillText(`V: enter x(X), enter y(Y): [${this.vel.x}, ${this.vel.y}]`, 700, (yPos += 30));
                        break;
                }
                break;
            case CmdState.Cam:
                switch (this.subCmd) {
                    default:
                        ctx.fillText(`c: LC to set, MC to reset: [${this.cam.x}, ${this.cam.y}]`, 700, (yPos += 30));
                        break;
                }
                break;
            default:
                break;
        }
    }

    vectorMsgTemplate(ctx: CanvasRenderingContext2D, letter: string, isx: boolean, val: Vector | null, yPos: number) {
        if (isx) ctx.fillText(`${letter} x: type or click: [${this.inputBuffer}, ${val ? val.y : 'NaN'}]`, 700, yPos);
        else ctx.fillText(`${letter} y: type or click: [${val ? val.x : 'NaN'}, ${this.inputBuffer}]`, 700, yPos);
    }

    clearProperties() {
        // Entity creation properties
        this.inputBuffer = '';
        this.validInput = false;
        this.cmdState = CmdState.NONE;
        this.subCmd = SubCmd.NONE;
        this.anchor = { x: 0.5, y: 0.5, z: 0.5 };
        this.pos = { x: 0, y: 0, z: 0 };
        this.vel = { x: 0, y: 0, z: 0 };
        this.size = { x: 10, y: 10, z: 0 };
    }

    preview(ctx: CanvasRenderingContext2D, offset: Vector, delta: number) {
        this.entities.forEach((ent) => {
            const prevFilter = ctx.filter;
            if (ent === this.focusedEntity) {
                ctx.filter = 'invert(75%)';
            }

            if (this.pause) ent.tick([], delta);
            ent.draw(ctx, { x: offset.x + this.cam.x, y: offset.y + this.cam.y, z: 0 });
            ctx.filter = prevFilter;
        });
    }

    createEntity(type: EntityName, pos: Vector, size: Vector, color: string): GenericObject {
        switch (type) {
            case EntityName.HurtBox:
                return new HurtBox(pos, size, color);
                break;
            case EntityName.Motion:
                return new HurtBoxMotion(pos, size, color);
                break;
            case EntityName.Platform:
                return new Platform(pos, size, color);
                break;
            case EntityName.Generic:
            default:
                return new GenericObject(pos, size, color);
                break;
        }
    }

    // automatically takes the current objects settings and translates them to the right
    addEntity(data: EntityData, bump: boolean) {
        console.log('addEntity');
        const d = {
            type: EntityName.Base,
            anchor: { ...data.anchor },
            pos: bump ? { x: data.pos.x + data.size.x, y: data.pos.y, z: 0 } : { ...data.pos },
            size: { ...data.size },
            vel: { ...data.vel },
            color: 'white',
        };
        this.data.push(d);
        this.focusedEntity = this.createEntity(this.type, { ...d.pos }, { ...d.size }, 'green');
        this.focusedEntity.setVel({ ...d.vel });
        this.focusedEntity.setAnchor({ ...d.anchor });
        this.entities.push(this.focusedEntity);
        this.index = this.entities.length - 1;

        this.save();
    }

    subEntity() {
        if (this.entities.length <= 2) return;
        console.log('subEntity');
        // remove entity as index
        this.entities = this.entities.filter((ent, index) => index !== this.index);
        this.data = this.data.filter((data, index) => index !== this.index);

        if (this.index > 0) this.index -= 1;
        this.focusedEntity = this.entities[this.index];

        this.save();
    }

    nextEntity() {
        if (this.data.length - 1 <= this.index) return;
        console.log('nextEntity');
        this.index += 1;
        this.focusedEntity = this.entities[this.index];
        const data = this.data[this.index];

        // update local data
        this.anchor = data.anchor;
        this.pos = data.pos;
        this.size = data.size;
        this.vel = data.vel;
    }

    prevEntity() {
        if (this.index < 1) return;
        console.log('prevEntity');
        this.index -= 1;
        this.focusedEntity = this.entities[this.index];
        const data = this.data[this.index];

        // update local data
        this.anchor = data.anchor;
        this.pos = data.pos;
        this.size = data.size;
        this.vel = data.vel;
    }

    save() {
        localStorage.setItem('lastObject', JSON.stringify(this.data));
    }

    saveToFile() {
        console.log(
            JSON.stringify({
                cage: 2,
                lifetime: 10000,
                entities: this.data,
            })
        );
    }

    updatePreview() {
        this.data[this.index].anchor = { ...this.anchor };
        this.data[this.index].pos = { ...this.pos };
        this.data[this.index].size = { ...this.size };
        this.data[this.index].vel = { ...this.vel };

        this.entities.forEach((ent, index) => {
            const d = this.data[index];
            ent.setAnchor({ ...d.anchor });
            ent.setVel({ ...d.vel });
            ent.setPos({ ...d.pos });
            ent.setSize({ ...d.size });
        });

        this.save();
    }

    // displayGrid() { }

    tick(ctx: CanvasRenderingContext2D, offset: Vector, delta: number) {
        if (this.hide) return;
        this.preview(ctx, offset, delta);

        // draw camera
        ctx.fillStyle = 'gold';
        ctx.fillRect(this.cam.x - offset.x, this.cam.y - offset.y, 10, 10);

        this.showCommands(ctx);
    }

    onClick(e: MouseEvent, offset: Vector) {
        switch (this.cmdState) {
            case CmdState.P:
                switch (this.subCmd) {
                    case SubCmd.X:
                        if (e.button === 0) {
                            let { x } = this.getMousePos(e, offset);
                            x -= x % this.snapToGridX;
                            console.log({ x });
                            this.inputBuffer = x.toString();
                        }
                        break;
                    case SubCmd.Y:
                        if (e.button === 0) {
                            let { y } = this.getMousePos(e, offset);
                            y -= y % this.snapToGridX;
                            console.log({ y });
                            this.inputBuffer = y.toString();
                        }
                        break;
                    default:
                        break;
                }
                break;
            case CmdState.S:
                switch (this.subCmd) {
                    case SubCmd.X:
                        if (e.button === 0) {
                            this.inputBuffer = Math.abs(this.pos.x - this.getMousePos(e, offset).x).toString();
                        }
                        break;
                    case SubCmd.Y:
                        if (e.button === 0) {
                            this.inputBuffer = Math.abs(this.getMousePos(e, offset).y - this.pos.y).toString();
                        }
                        break;
                    default:
                        break;
                }
                break;
            case CmdState.Cam:
                if (e.button === 0) {
                    this.cam = { x: this.cam.x + e.offsetX + offset.x, y: this.cam.y + e.offsetY + offset.y, z: 0 };
                } else if (e.button === 1) {
                    this.cam = { x: 0, y: 0, z: 0 };
                }
                break;
            default:
                break;
        }
    }

    getMousePos(e: MouseEvent, offset: Vector): Vector {
        return { x: e.offsetX + offset.x, y: e.offsetY + offset.y, z: 0 };
    }
}
