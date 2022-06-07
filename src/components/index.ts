import { FrameRate } from './framerate';
import Game from './Game/Game';

let game = null as Game | null;
let framelock = null as FrameRate | null;

export const gameInit = () => {
    game = new Game();
    framelock = new FrameRate(60);
    framelock.debug = true;
};

export const renderLoop = () => {
    requestAnimationFrame(renderLoop);
    framelock?.tick(game?.tick);
};

export * from './canvas';
