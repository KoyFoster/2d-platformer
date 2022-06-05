import { Vector } from "./Game/Lib";

export class DevTools {
    mousePos: Vector;
    mouseHold: boolean;
    mouseDragDir: Vector;

    constructor(offset: Vector) {
        // Input Listeners
        window.addEventListener('mousemove', (e) => this.onMouseMove(e, offset));
        window.addEventListener('mouseup', (e) => this.onClick(e));
        // window.addEventListener('drag', (e) => this.onDrag(e, true));
        // window.addEventListener('dragend', (e) => this.onDrag(e, false));

        this.mousePos = { x: 0, y: 0, z: 0 }
        this.mouseHold = false;
        this.mouseDragDir = { x: 0, y: 0, z: 0 }
    }

    tick(ctx: CanvasRenderingContext2D) {

        // capture mouse position
        // determine if mouse is held
        // calculate endposition of drag

        // UI
        // draw relative to camera
        ctx!.fillText(`Mouse:[${this.mousePos.x}, ${this.mousePos.y}, ${this.mouseHold}]`, 900, 50);
    }
    onClick(e: MouseEvent) {
        e.stopPropagation();
        e.preventDefault();
        // log entity meta data for copying
        if (e.button === 0)
            console.log(["base", { "x": 0.5, "y": 0, "z": 0 }, { "x": -600, "y": -144, "z": 0 }, { "x": 18, "y": 202, "z": 0 }, { "x": 400, "y": 0, "z": 0 }]);
        else if (e.type === 'Right click') { console.log('right click') }
    }

    onMouseMove(e: MouseEvent, offset: Vector) {
        // var bounds = e.target.getBoundingClientRect();
        // console.log(bounds)

        this.mousePos.x = e.offsetX + offset.x;
        this.mousePos.y = e.offsetY + offset.y;
    }
    onDrag(e: DragEvent, isHeld: boolean) {
        this.mousePos.z = 1;
    }
}