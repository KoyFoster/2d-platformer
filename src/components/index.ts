import Game from './Game/Game';
import map from './Game/Maps/level_0.json'

let game = null as Game | null;

export const gameInit = () => {
    game = new Game();
    game.loadMap(map);
}

export const renderLoop = () => {
    requestAnimationFrame(renderLoop);

    game?.tick();
}


export * from './canvas';