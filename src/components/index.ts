import { FrameRate } from './framerate';
import Game from './Game/Game';
import map from './Game/Maps/cage_0.json';

let game = null as Game | null;
let framelock = null as FrameRate | null;

export const gameInit = () => {
    game = new Game();
    framelock = new FrameRate(60);
    framelock.debug = true;
    game.loadMap(map);
}

export const renderLoop = () => {
    requestAnimationFrame(renderLoop);
    framelock?.tick(game?.tick);
}


export * from './canvas';