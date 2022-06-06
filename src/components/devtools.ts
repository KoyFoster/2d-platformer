import { Entity, HurtBox } from "./Game/Entities";
import { BaseObject, Entity_Object } from "./Game/Entities/objects/object";
import { Vector } from "./Game/Lib";

enum CmdState { A, P, S, V, C, NONE };
enum SubCmd { X, Y, NONE };

export class DevTools {
    hide = false as boolean;
    // Entity creation properties
    inputBuffer: string;
    validInput: boolean;
    cmdState: CmdState;
    subCmd: SubCmd;

    anchor: Vector;
    pos: Vector;
    vel: Vector;
    size: Vector;

    previewEntity = null as BaseObject | null;

    // states
    lockAxis: boolean; // as in only translate on x or y axis

    constructor(offset: Vector) {
        let lastObject = localStorage.getItem('lastObject') as Entity_Object | string | null;
        lastObject = lastObject ? JSON.parse(lastObject as string) as Entity_Object | null : null;

        const hide = localStorage.getItem('hideDev');
        if (hide && hide === 'true') this.hide = true;

        // Entity creation properties
        this.inputBuffer = '';
        this.validInput = false;
        this.cmdState = CmdState.NONE;
        this.subCmd = SubCmd.NONE;

        if (lastObject) {
            this.anchor = lastObject.anchor;
            this.pos = lastObject.pos;
            this.size = lastObject.size;
            this.vel = lastObject.vel;
        }
        else {
            this.anchor = { x: 0.5, y: 0.5, z: 0.5 };
            this.pos = { x: 0, y: 0, z: 0 }
            this.size = { x: 10, y: 10, z: 0 }
            this.vel = { x: 0, y: 0, z: 0 }
        }

        this.previewEntity = new BaseObject({ ...this.pos }, { ...this.size }, 'green');
        this.previewEntity.setVel({ ...this.vel })
        this.previewEntity.setAnchor({ ...this.anchor });

        this.lockAxis = true;

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

        if (this.subCmd === SubCmd.NONE)
            switch (e.key.toLowerCase()) {
                case 'a': this.cmdState = CmdState.A; break;
                case 'p': this.cmdState = CmdState.P; break;
                case 'v': this.cmdState = CmdState.V; break;
                case 's': this.cmdState = CmdState.S; break;
                case 'r': this.updatePreview(); break;
                case 'c':
                    if (!e.shiftKey) {
                        if (this.cmdState === CmdState.NONE) {
                            this.clearProperties();
                            this.updatePreview();
                        }
                    }
                    else {
                        // print to console
                        const buffer = JSON.stringify({
                            type: 'Base',
                            anchor: this.anchor,
                            pos: this.pos,
                            size: this.size,
                            vel: this.vel ? this.vel : { x: 0, y: 0, z: 0 },
                            color: 'white'
                        });
                        console.log(buffer);
                    }
                    break;
                case 'enter':
                case 'escape': break;
                default: break;
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

    // enum SubCmd { Px, Py, Sx, Sy, Vx, Vy, NONE };
    subCommands(e: KeyboardEvent) {
        const key = e.key.toLowerCase();
        if (this.subCmd === SubCmd.NONE)
            switch (this.cmdState) {
                case CmdState.NONE:
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
                        default: break;
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
                        default: break;
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
                        default: break;
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
                        default: break;
                    }
                    break;
                default: break;
            }
        else {
            this.captureInput(key);
            // check input
            let buffer = 0 as number | null;
            switch (key) {
                case 'escape':
                    this.subCmd = SubCmd.NONE;
                    break;

                case 'enter':
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
                        }
                    }

                    // on successful update, reset preview
                    if (change)
                        this.updatePreview();

                    break; // end of Enter
            } // end of key switch
        }
    }

    captureInput(key: string) {
        switch (key) {
            case 'backspace':
                this.inputBuffer = this.inputBuffer.slice(0, this.inputBuffer.length - 1);
                break;
        }
        if (key.length > 1) return;
        switch (key) {
            default: this.inputBuffer += key; break;
        }
    }

    showCommands(ctx: CanvasRenderingContext2D, offset: Vector) {
        ctx!.font = "24px Ariel";
        let yPos = 20;
        ctx!.fillText(`Commands:`, 650, yPos += 30);
        switch (this.cmdState) {
            case CmdState.NONE:
                ctx!.fillText(`A: set Anchor: [${this.anchor.x}, ${this.anchor.y}]`, 700, yPos += 30);
                ctx!.fillText(`P: set Position: [${this.pos.x}, ${this.pos.y}]`, 700, yPos += 30);
                ctx!.fillText(`V: set Velocity${this.vel ? `: [${this.vel.x}, ${this.vel.y}]` : ''}`, 700, yPos += 30);
                ctx!.fillText(`S: set Size: [${this.size.x}, ${this.size.y}]`, 700, yPos += 30);
                ctx!.fillText(`R: reload preview`, 700, yPos += 30);
                ctx!.fillText(`C: cancel settings`, 700, yPos += 30);
                break;
            case CmdState.A:
                switch (this.subCmd) {
                    case SubCmd.X:
                        this.vectorMsgTemplate(ctx, 'P', true, this.anchor, yPos += 30);
                        break;
                    case SubCmd.Y:
                        this.vectorMsgTemplate(ctx, 'P', false, this.anchor, yPos += 30);
                        break;
                    default:
                        ctx!.fillText(`A: enter x(X), enter y(Y): [${this.anchor.x}, ${this.anchor.y}]`, 700, yPos += 30);
                        break;
                }
                break;
            case CmdState.P:
                switch (this.subCmd) {
                    case SubCmd.X:
                        this.vectorMsgTemplate(ctx, 'P', true, this.pos, yPos += 30);
                        break;
                    case SubCmd.Y:
                        this.vectorMsgTemplate(ctx, 'P', false, this.pos, yPos += 30);
                        break;
                    default:
                        ctx!.fillText(`P: enter x(X), enter y(Y): [${this.pos.x}, ${this.pos.y}]`, 700, yPos += 30);
                        break;
                }
                break;
            case CmdState.S:
                switch (this.subCmd) {
                    case SubCmd.X:
                        this.vectorMsgTemplate(ctx, 'S', true, this.size, yPos += 30);
                        break;
                    case SubCmd.Y:
                        this.vectorMsgTemplate(ctx, 'S', false, this.size, yPos += 30);
                        break;
                    default:
                        ctx!.fillText(`S: enter x(X), enter y(Y): [${this.size.x}, ${this.size.y}]`, 700, yPos += 30);
                        break;
                }
                break;
            case CmdState.V:
                switch (this.subCmd) {
                    case SubCmd.X:
                        this.vectorMsgTemplate(ctx, 'V', true, this.vel, yPos += 30);
                        break;
                    case SubCmd.Y:
                        this.vectorMsgTemplate(ctx, 'V', false, this.vel, yPos += 30);
                        break;
                    default:
                        ctx!.fillText(`V: enter x(X), enter y(Y)${this.vel ? `: [${this.vel.x}, ${this.vel.y}]` : ''}`, 700, yPos += 30);
                        break;
                }
                break;
            default: break;
        }
    }

    vectorMsgTemplate(ctx: CanvasRenderingContext2D, letter: string, isx: boolean, val: Vector | null, yPos: number) {
        if (isx)
            ctx!.fillText(`${letter} x: type or click: [${this.inputBuffer}, ${val ? val!.y : 'NaN'}]`, 700, yPos);
        else
            ctx!.fillText(`${letter} y: type or click: [${val ? val!.x : 'NaN'}, ${this.inputBuffer}]`, 700, yPos);
    }

    clearProperties() {
        // Entity creation properties
        this.inputBuffer = '';
        this.validInput = false;
        this.cmdState = CmdState.NONE;
        this.subCmd = SubCmd.NONE;
        this.anchor = { x: 0.5, y: 0.5, z: 0.5 };
        this.pos = { x: 0, y: 0, z: 0 };
        this.vel = { x: 0, y: 0, z: 0 }
        this.size = { x: 10, y: 10, z: 0 }
    }

    preview(ctx: CanvasRenderingContext2D, offset: Vector, delta: number) {
        this.previewEntity!.tick([], delta);
        this.previewEntity!.draw(ctx, offset);
    }

    updatePreview() {
        localStorage.setItem('lastObject', JSON.stringify({
            type: 'Base',
            anchor: this.anchor,
            pos: this.pos,
            size: this.size,
            vel: this.vel ? this.vel : { x: 0, y: 0, z: 0 },
            color: 'white'
        }));

        this.previewEntity!.setAnchor(this.anchor);
        this.previewEntity!.setVel(this.vel ? { ...this.vel } : { x: 0, y: 0, z: 0 });
        this.previewEntity!.setPos({ ...this.pos });
        this.previewEntity!.setSize(this.size);
    }

    tick(ctx: CanvasRenderingContext2D, offset: Vector, delta: number) {
        if (this.hide) return;
        this.preview(ctx, offset, delta);

        this.showCommands(ctx, offset)
    }

    onClick(e: MouseEvent, offset: Vector) {
        switch (this.cmdState) {
            case CmdState.P:
                switch (this.subCmd) {
                    case SubCmd.X:
                        if (e.button === 0) {
                            this.inputBuffer = this.getMousePos(e, offset).x.toString();
                        }
                        break;
                    case SubCmd.Y:
                        if (e.button === 0) {
                            this.inputBuffer = this.getMousePos(e, offset).y.toString();
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
                            this.inputBuffer = Math.abs((this.pos.x - this.getMousePos(e, offset).x)).toString();
                        }
                        break;
                    case SubCmd.Y:
                        if (e.button === 0) {
                            this.inputBuffer = Math.abs((this.getMousePos(e, offset).y - this.pos.y)).toString();
                        }
                        break;
                    default:
                        break;
                }
                break;
        }
    }

    getMousePos(e: MouseEvent, offset: Vector): Vector {
        return { x: e.offsetX + offset.x, y: e.offsetY + offset.y, z: 0 }
    }
}