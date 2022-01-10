//import Phaser from "//cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.js";
import Game from "./scenes/game.js";

const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 1280,
    height: 900,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_HORIZONTALLY
    },
    backgroundColor: '#999999',
    dom: {
        createContainer: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 }
        }
    },    
    scene: [
        Game
    ] 
};

const game = new Phaser.Game(config);
