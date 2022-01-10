import Card from './card.js';

export default class Player {
    constructor(index, isComputer) {
        this.index = index;
        this.isComputer = isComputer;
        this.bid = -1;
        this.bestSuit = -1;
        this.playerCards = []; // Start with an empty hand
        this.generate = (x, y, scene) => {
            var suitnames = ['clubs', 'hearts', 'spades', 'diamonds'];
            for (let i = 0; i < this.playerCards.length; i++) {
                this.x = x;
                this.y = y;
                // just off screen near the dealer
                if (scene.dealer == 0) {
                    var dealerx = scene.players[scene.dealer].x;
                    var dealery = 1050;
                } else if (scene.dealer == 1) {
                    var dealerx = -50;
                    var dealery = scene.players[scene.dealer].y;
                } else if (scene.dealer == 2) {
                    var dealerx = scene.players[scene.dealer].x;
                    var dealery = -125;
                } else {
                    var dealerx = 1350;
                    var dealery = scene.players[scene.dealer].y;                    
                }
                if (this.index == 0) {
                    this.playerCards[i].render(dealerx, dealery, 'cards', suitnames[this.playerCards[i].suit]+''+this.playerCards[i].rank, scene);
                } else {
                    this.playerCards[i].render(dealerx, dealery, 'cards', 'back', scene);
                }
            }   
        }
        this.render = (x, y, scene) => {
            var suitnames = ['clubs', 'hearts', 'spades', 'diamonds'];
            for (let i = 0; i < this.playerCards.length; i++) {
                this.x = x;
                this.y = y;
                if (this.index == 0) {
                    this.playerCards[i].render(x + (i * 36), y, 'cards', suitnames[this.playerCards[i].suit]+''+this.playerCards[i].rank, scene);
                } else {
                    this.playerCards[i].render(x + (i * 36), y, 'cards', 'back', scene);
                }
            }
        }
        
    }
    
    lightUp(tween, targets, winner, game) {
        var particles = game.add.particles('yellow');

        var emitter = particles.createEmitter({
            speed: 100,
            scale: { start: 1, end: 0 },
            blendMode: 'ADD'
        });
        game.time.delayedCall(1050, ()=>{
            emitter.stop();
        });

        var logo = targets[winner];
        emitter.startFollow(logo);             
    }
    
    aiBid() {
        var bestBid = 0;
        var bid;
        
        for (var suitItem = 0;suitItem < 4;suitItem++) {
            bid = 0;
            this.playerCards.forEach (function (cardItem) {
                if ((cardItem.suit == suitItem) || ((cardItem.suit == 1) && (cardItem.rank == 'Ace'))) {
                    if (cardItem.rank == '5') {
                        bid = Phaser.Math.MaxAdd(bid, 20, 30);
                    } else if (cardItem.rank == 'Jack') {
                        bid = Phaser.Math.MaxAdd(bid, 8, 30);
                    } else {
                        bid = Phaser.Math.MaxAdd(bid, 3, 30);
                    }
                }
                // add up the bid values
            
            });
            if (bid > bestBid) {
                bestBid = bid;
                this.bestSuit = suitItem;
            }
        }
        if (bestBid < 20) { // no 15 bids
            bestBid = 0;
        } else {
            bestBid = Phaser.Math.FloorTo(bestBid / 5) * 5;
        }
        //bestBid = 0;
        return bestBid;
    }
    
    makePlayable(game, tSuit, trumped, leadpoints) {
        var xAdj = 0;
        var yAdj = 0;
        if (this.index == 1) {
            xAdj = -35;
            yAdj = 10;
        } else if (this.index == 2) {
            yAdj = -35;
        } else if (this.index == 3) {
            xAdj = 35;
            yAdj = -10;
        } else {
            yAdj = 35;
        }
        var trumpsTicker = 0;
        var renegableTicker = 0;
        console.log('opening up play buttons (index:' + this.index + ')');
        for (var i = 0; i < game.players[0].playerCards.length; i++) {
            if ((game.players[0].playerCards[i].suit == tSuit) || ((game.players[0].playerCards[i].rank == 'Ace') && (game.players[0].playerCards[i].suit == 1))) {
                trumpsTicker++;
                if ((((game.players[0].playerCards[i].rank == 'Ace') && (game.players[0].playerCards[i].suit == 1)) || (game.players[0].playerCards[i].rank == 'Jack') || (game.players[0].playerCards[i].rank == '5')) && (game.players[0].playerCards[i].getPointsValue(tSuit) > leadpoints)) {
                    renegableTicker++;
                }
            }
            game.players[0].playerCards[i].pic.setTint();
        }    
        //console.log('game playercards legth: ' + game.players[0].playerCards.length);
        var self = this;
        this.playerCards.forEach(function(item, index) {
            item.pic.setInteractive();
            item.pic.off('pointerup');
            
            if (item.isTrump(tSuit) || (((!trumped) || (trumpsTicker == 0) || (renegableTicker == trumpsTicker)))) {
                item.pic.on('pointerover', function() {
                    this.setTint(0x88ff88);
                    //console.log(item.isTrump(tSuit) + ' ' + trumped + ' ' + trumpsTicker+ ' ' + renegableTicker);
                });  
            } else {
                // board is trumped and you have non-renegable trumps
                item.pic.on('pointerover', function() {
                    this.setTint(0xff8888);
                });
            }
            

            item.pic.on('pointerout', function() {
                this.clearTint();
            });
            if (item.isTrump(tSuit) || (((!trumped) || (trumpsTicker == 0) || (renegableTicker == trumpsTicker)))) {    // only for legal plays
                //console.log('activating a card ' + index);
                item.pic.on('pointerup', function() {   
                    self.makeUnplayable(game);
                    game.socket.emit("cardPlayed", game.mySeat, index);
                    //game.registerPlay(-1, this, index, item);
                });
            }    
        });
    }
    
    slideItIn(game, cardIndex) {
        var xAdj = 0;
        var yAdj = 0;
        if (this.index == 1) {
            xAdj = -35;
            yAdj = 10;
        } else if (this.index == 2) {
            yAdj = -35;
        } else if (this.index == 3) {
            xAdj = 35;
            yAdj = -10;
        } else {
            yAdj = 35;
        }
        //var slidCard = this.playerCards.splice(cardIndex, 1)[0]; // remove from player
        this.playerCards[cardIndex].pic.clearTint();
        //console.log('setting play depth to ' + game.playsIn);
        this.playerCards[cardIndex].flipUp(this.playerCards[cardIndex].pic.x, this.playerCards[cardIndex].pic.y, game);
        this.playerCards[cardIndex].pic.setDepth(game.playsIn);
        game.tweens.add({   // slide in the played card
            targets: this.playerCards[cardIndex].pic,
            x: 635 + xAdj,
            y: 410 + yAdj,
            ease: 'Power1',
            duration: 200,
            onStart: game.registerPlay,
            onStartParams: [this.index, cardIndex, this.playerCards[cardIndex]]
        });           
        
    }
    
    makeUnplayable(game) {
        console.log('function makeunplayable');
        this.playerCards.forEach(function(item) {
            item.pic.off('pointerover');
            item.pic.off('pointerout');            
            item.pic.off('pointerup');
        });
    }
}