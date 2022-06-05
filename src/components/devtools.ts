import { Entity, HurtBox } from "./Game/Entities";
import { BaseObject, Entity_Object } from "./Game/Entities/objects/object";
import { Vector } from "./Game/Lib";

enum CmdState { A, P, S, V, C, NONE };
enum SubCmd { X, Y, NONE };

enum Anchors { LEFT = 1, RIGHT = 2, TOP = 3, BOTTOM = 4, CENTER = 0 }
interface IDictionary {
    [index: string]: Vector;
}
const ANCHORS = {
    "LEFT": { x: 0, y: 0.5, z: 0.5 },
    "RIGHT": { x: 1, y: 0.5, z: 0.5 },
    "TOP": { x: 0.5, y: 0, z: 0.5 },
    "BOTTOM": { x: 0.5, y: 1, z: 0.5 },
    "CENTER": { x: 0.5, y: 0.5, z: 0.5 }
} as IDictionary;

export class DevTools {
    // Entity creation properties
    inputBuffer: string;
    validInput: boolean;
    cmdState: CmdState;
    subCmd: SubCmd;

    anchorType: Anchors;
    pos: Vector | null;
    end: Vector | null;
    vel: Vector | null;
    size: Vector | null;

    previewEntity = new BaseObject({ x: 0, y: 0, z: 0 }, { x: 10, y: 10, z: 0 }, 'green') as BaseObject;

    // states
    lockAxis: boolean; // as in only translate on x or y axis

    constructor(offset: Vector) {
        // Entity creation properties
        this.inputBuffer = '';
        this.validInput = false;
        this.cmdState = CmdState.NONE;
        this.subCmd = SubCmd.NONE;
        this.anchorType = Anchors.CENTER;
        this.pos = null
        this.end = null
        this.vel = null
        this.size = null

        this.lockAxis = true;

        // SETUP LISTENER        
        // Input Listeners
        window.addEventListener('mouseup', (e) => this.onClick(e, offset));
        window.addEventListener('keyup', (e) => this.commands(e));
        // window.addEventListener('mousemove', (e) => this.onMouseMove(e, offset));
        // window.addEventListener('drag', (e) => this.onDrag(e, true));
        // window.addEventListener('dragend', (e) => this.onDrag(e, false));
    }

    // Commands
    commands(e: KeyboardEvent) {
        if (this.subCmd === SubCmd.NONE)
            switch (e.key.toLowerCase()) {
                case 'a': this.cmdState = CmdState.A; break;
                case 'p': this.cmdState = CmdState.P; break;
                case 'v': this.cmdState = CmdState.V; break;
                case 's': this.cmdState = CmdState.S; break;
                case 'r': this.updatePreview(); break;
                case 'c':
                    if (this.cmdState === CmdState.NONE) {
                        this.clearProperties();
                        this.updatePreview();
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
                        case 'l':
                            this.anchorType = Anchors.LEFT;
                            this.updatePreview();
                            this.cmdState = CmdState.NONE;
                            break;
                        case 'r':
                            this.anchorType = Anchors.RIGHT;
                            this.updatePreview();
                            this.cmdState = CmdState.NONE;
                            break;
                        case 't':
                            this.anchorType = Anchors.TOP;
                            this.updatePreview();
                            this.cmdState = CmdState.NONE;
                            break;
                        case 'b':
                            this.anchorType = Anchors.BOTTOM;
                            this.updatePreview();
                            this.cmdState = CmdState.NONE;
                            break;
                        case 'c':
                            this.anchorType = Anchors.CENTER;
                            this.updatePreview();
                            this.cmdState = CmdState.NONE;
                            break;
                        case 'enter':
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
                ctx!.fillText(`A: set Anchor: ${this.anchorType}`, 700, yPos += 30);
                ctx!.fillText(`P: set Position${this.pos ? `: [${this.pos.x}, ${this.pos.y}]` : ''}`, 700, yPos += 30);
                ctx!.fillText(`V: set Velocity${this.vel ? `: [${this.vel.x}, ${this.vel.y}]` : ''}`, 700, yPos += 30);
                ctx!.fillText(`S: set Size${this.size ? `: [${this.size.x}, ${this.size.y}]` : ''}`, 700, yPos += 30);
                ctx!.fillText(`R: reload preview`, 700, yPos += 30);
                ctx!.fillText(`C: cancel settings`, 700, yPos += 30);
                break;
            case CmdState.A:
                ctx!.fillText(`A: Left(L), Right(R), TOP(T), BOTTOM(B), Center(C)`, 700, yPos += 30);
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
                        ctx!.fillText(`P: enter x(X), enter y(Y)${this.pos ? `: [${this.pos.x}, ${this.pos.y}]` : ''}`, 700, yPos += 30);
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
                        ctx!.fillText(`S: enter x(X), enter y(Y)${this.size ? `: [${this.size.x}, ${this.size.y}]` : ''}`, 700, yPos += 30);
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
        this.anchorType = Anchors.CENTER;
        this.pos = null
        this.end = null
        this.vel = null
        this.size = null
    }

    preview(ctx: CanvasRenderingContext2D, offset: Vector, delta: number) {
        this.previewEntity.tick([], delta);
        this.previewEntity.draw(ctx, offset);
    }

    updatePreview() {
        const anc = Anchors[this.anchorType];
        this.previewEntity.setAnchor(ANCHORS[anc]);
        this.previewEntity.setVel(this.vel ? { ...this.vel } : { x: 0, y: 0, z: 0 });
        this.previewEntity.setPos(this.pos ? { ...this.pos } : { x: 0, y: 0, z: 0 });
        this.previewEntity.setSize(this.size ? { ...this.size } : { x: 10, y: 10, z: 0 });
    }

    tick(ctx: CanvasRenderingContext2D, offset: Vector, delta: number) {
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
        }
    }

    getMousePos(e: MouseEvent, offset: Vector): Vector {
        return { x: e.offsetX + offset.x, y: e.offsetY + offset.y, z: 0 }
    }
}