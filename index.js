import Game from "./scenes/game.js";

const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 1280,
    height: 850,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_HORIZONTALLY
    },
    backgroundColor: 0x662222,
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

