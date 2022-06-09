import { Vector } from '../components/Game/Lib';

export class MouseDrag {
    drag = false as boolean;

    pos = null as Vector | null;

    prevPos = null as Vector | null;

    startingPos = null as Vector | null;

    onMove(e: MouseEvent, parent: HTMLCanvasElement) {
        if (this.drag && parent === e.target) {
            this.prevPos = this.pos;
            this.pos = { x: e.offsetX, y: e.offsetY, z: 1 };
            if (this.startingPos === null) this.startingPos = this.pos;
        }
    }

    doDrop() {
        this.drag = false;
        const result = this.getDragMovement();
        this.pos = null;
        this.prevPos = null;
        this.startingPos = null;
        return result;
    }

    getDragMovement() {
        if (this.prevPos !== null && this.pos !== null) return { x: this.pos.x - this.prevPos.x, y: this.pos.y - this.prevPos.y, z: 0 };
        return { x: 0, y: 0, z: 0 };
    }

    getFullDragMovement(drop = false as boolean) {
        let result = { x: 0, y: 0, z: 0 };
        if (this.startingPos !== null && this.pos !== null) result = { x: this.pos.x - this.startingPos.x, y: this.pos.y - this.startingPos.y, z: 0 };
        if (drop) this.doDrop();

        return result;
    }

    doDrag(drag: boolean) {
        this.drag = drag;
    }
}
