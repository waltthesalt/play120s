import Game from "./scenes/game.js";

const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 1280,
    height: 900,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    backgroundColor: 0x25855D,
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

