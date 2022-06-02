export class FrameRate {
    debug: boolean;
    fps: number;
    time: number; // seconds

    stop: boolean;
    count: number;
    cap: number;
    interval: number;
    start: number;
    now: number;
    then: number;
    prev: number;
    elapsed: number;
    delta: number;

    constructor(fps: number) {
        this.debug = false;
        this.time = 0;
        this.fps = 0;

        this.stop = false;
        this.count = 0;
        this.cap = 0;
        this.now = 0;
        this.elapsed = 0;
        this.delta = 0;

        this.interval = 1000 / fps;
        this.then = Date.now();
        this.prev = this.then;
        this.start = this.then;
    }

    tick(logic: Function | undefined) {
        // calc elapsed time since last loop
        // get deltatime
        this.delta = performance.now() - this.prev;
        this.prev = performance.now();
        // get elapse
        this.now = Date.now();
        this.elapsed = this.now - this.then;
        // if enough time has elapsed, draw the next frame

        if (this.elapsed > this.interval) {

            // Get ready for next frame by setting then=now, but...
            // Also, adjust for fpsInterval not being multiple of 16.67
            this.then = this.now - (this.elapsed % this.interval);

            // draw stuff here
            let ctx = null as CanvasRenderingContext2D | null;
            if (logic) ctx = logic(this.debug)

            // TESTING...Report #seconds since start and achieved fps.
            if (this.debug) {
                var sinceStart = this.now - this.start;
                this.fps = Math.round(1000 / (sinceStart / ++this.count) * 100) / 100;
                this.time = Math.round(sinceStart / 1000 * 100) / 100;

                // UI
                // draw relative to camera
                ctx!.font = "30px Ariel";
                ctx!.fillText(`FPS:${this.fps}`, 33, 50);
                ctx!.fillText(`Delta:${this.delta}`, 33, 80);
            }
        }
    }

}