import Card from './card.js';

export default class Player {
    constructor(index, isComputer, x = -1, y = -1) {
        this.index = index;
        this.isComputer = isComputer;
        this.bid = -1;
        this.bestSuit = -1;
        this.playerCards = []; // Start with an empty hand
        this.x = x;
        this.y = y;
    }
    
    copyPlayer() {
        var newP = new Player(this.index, this.isComputer);
        for (var i=0;i < this.playerCards.length;i++) {
            newP.playerCards.push(this.playerCards[i]);
        }
        return newP;
    }
    
    getHandValue(trumpSuit) {
        var val = 0;
        for (var i=0;i < this.playerCards.length;i++) {
            val+=this.playerCards[i].getPointsValue(trumpSuit);
        }
        return val;
    }
    
    findCard(cardToFind) {
        //console.log('trying to remove the '+ cardToRemove.rank + ' of ' + cardToRemove.suit);
        const isTheRightCard = (element) => ((element.rank == cardToFind.rank) && (element.suit == cardToFind.suit));
        var pos = this.playerCards.findIndex(isTheRightCard);
        if (pos > -1) {
            //console.log('found it');
            return pos;
        } else {
            console.log('couldnt find the ' + cardToFind.displayCard());
            console.log('searching in here:'+this.displayHand());
            return false;
        }
    }    
    
    removeCard(cardToRemove) {
        //console.log('trying to remove the '+ cardToRemove.rank + ' of ' + cardToRemove.suit);
        const isTheRightCard = (element) => ((element.rank == cardToRemove.rank) && (element.suit == cardToRemove.suit));
        var pos = this.playerCards.findIndex(isTheRightCard);
        if (pos > -1) {
            //console.log('found it');
            this.playerCards.splice(pos, 1);
            return true;
        } else {
            console.log('couldnt find the ' + cardToRemove.rank + ' of ' + cardToRemove.suit);
            console.log('searching in here:'+this.displayHand());
            return false;
        }
    }
    
    lightUp(tween, targets, winner, game) {
        var particles = game.add.particles('yellow');

        var emitter = particles.createEmitter({
            speed: 100,
            scale: { start: 1, end: 0 },
            blendMode: 'ADD'
        });
        game.time.delayedCall(700, ()=>{
            emitter.stop();
        });

        var logo = targets[winner];
        emitter.startFollow(logo);             
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
        console.log('opening up ' + game.players[game.mySeat].playerCards.length + ' playable cards (index:' + this.index + ') and trump is '+tSuit);
        for (var i = 0; i < game.players[game.mySeat].playerCards.length; i++) {
            if ((!game.players[game.mySeat].playerCards[i].isPlayed()) && ((game.players[game.mySeat].playerCards[i].suit == tSuit) || ((game.players[game.mySeat].playerCards[i].rank == 'Ace') && (game.players[game.mySeat].playerCards[i].suit == 1)))) {
                trumpsTicker++;
                if ((((game.players[game.mySeat].playerCards[i].rank == 'Ace') && (game.players[game.mySeat].playerCards[i].suit == 1)) || (game.players[game.mySeat].playerCards[i].rank == 'Jack') || (game.players[game.mySeat].playerCards[i].rank == '5')) && (game.players[game.mySeat].playerCards[i].getPointsValue(tSuit) > leadpoints)) {
                    renegableTicker++;
                }
            }
            game.players[game.mySeat].playerCards[i].pic.setTint();
        }    
        console.log('trump count:'+trumpsTicker+' renegable count:'+renegableTicker);
        var self = this;
        this.playerCards.forEach(function(item, index) {
            if (!item.isPlayed()) {     // Don't make cards playable if they are gone from the hand
                item.pic.setInteractive();
                item.pic.off('pointerup');
                //console.log('Removing stale listener from ' + index);
                
                if (item.isTrump(tSuit) || (((!trumped) || (trumpsTicker == 0) || (renegableTicker == trumpsTicker)))) {
                    item.pic.on('pointerover', function() {
                        this.setTint(0x88ff88); // This card in is an option so shade it green
                        //console.log('Allowing card '+index);
                    });  
                } else {
                    // board is trumped and you have non-renegable trumps
                    item.pic.on('pointerover', function() {
                        this.setTint(0xff8888); // This card is not an option so shade it red
                        //console.log('Disallowing card '+index);
                    });
                }
                
    
                item.pic.on('pointerout', function() {
                    this.clearTint();
                });
                if (item.isTrump(tSuit) || (((!trumped) || (trumpsTicker == 0) || (renegableTicker == trumpsTicker)))) {    // only set the listener for legal plays
                    console.log('activating card ' + index);
                    item.pic.on('pointerup', function() {   
                        self.makeUnplayable(game);
                        game.socket.emit("cardPlayed", game.mySeat, index); // Telling the server
                        game.showReceivedPlay(game.mySeat, index);          // Show it on my screen right away to avoid server lag
                    });
                }    
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
            duration: 200
        });           
        
    }
    
    makeUnplayable(game) {
        this.playerCards.forEach(function(item) {
            item.pic.off('pointerover');
            item.pic.off('pointerout');            
            item.pic.off('pointerup');
        });
    }
    
    displayHand() {
        var fullArr = '';
        for (var i = 0; i < this.playerCards.length; i++) {
            if ((this.playerCards[i].suit) == 0) {
                var niceSymbol = '♣';
            } else if ((this.playerCards[i].suit) == 1) {
                var niceSymbol = '♥';
            } else if ((this.playerCards[i].suit) == 2) {
                var niceSymbol = '♠';
            } else {
                var niceSymbol = '♦';
            }
            fullArr = fullArr + this.playerCards[i].rank.substring(0,1) + niceSymbol + ' ';
        }
        //console.log(fullArr);
        return fullArr;
    }    
    
    unplayedLength() {
        var len = 0;
        for (var i = 0; i < this.playerCards.length; i++) {
            if (!this.playerCards[i].isPlayed()) {
                len++;
            } 
        }
        return len;
    }    
    
    legalPlays(whistToBoard, trumpSuit, leadPoints = 0) {
        var trumpsTicker = 0;
        var renegableTicker = 0;
        var legals = [];
        for (var i = 0; i < this.playerCards.length; i++) {
            if ((!this.playerCards[i].isPlayed()) && (this.playerCards[i].isTrump(trumpSuit))) {
                trumpsTicker++;
                if ((((this.playerCards[i].rank == 'Ace') && (this.playerCards[i].suit == 1)) || (this.playerCards[i].rank == 'Jack') || (this.playerCards[i].rank == '5')) && (this.playerCards[i].getPointsValue(trumpSuit) > leadPoints)) {
                    renegableTicker++;
                }
            }        
        }
        for (i = 0; i < this.playerCards.length; i++) {
            if (!this.playerCards[i].isPlayed() && ((!whistToBoard) || (this.playerCards[i].isTrump(trumpSuit)) || (trumpsTicker == 0) || (renegableTicker == trumpsTicker))) {
                legals.push(this.playerCards[i]);
            } 
        }
        return legals;
    }    
    
    trumpCount(trumpSuit) {
        var ticker = 0;
        for (var i = 0; i < this.playerCards.length; i++) {
            if (!this.playerCards[i].isPlayed() && (this.playerCards[i].isTrump(trumpSuit))) {
                ticker++;
            }
        }
        return ticker;
    }
}