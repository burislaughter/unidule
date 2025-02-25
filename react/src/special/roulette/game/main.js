import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { Roulette } from './scenes/Roulette';
import Phaser from 'phaser';
import { Preloader } from './scenes/Preloader';

// Find out more information about the Game Config at:
// https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
let config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 1024,
    fps:{
        limit:0
    },
    // audio: {
    //     disableWebAudio: true
    // },
    parent: 'game-container',
    backgroundColor: '#028af8',
    scene: [
        Boot,
        Preloader,
        Roulette,
        Game,
        GameOver
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    }
};

const StartGame = (parent) => {

    // FPS制限
    // config.fps.limit = 60;
    return new Phaser.Game({ ...config, parent });
}

export default StartGame;
