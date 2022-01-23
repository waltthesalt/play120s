import Card from '../helpers/card.js';
import Player from '../helpers/player.js';
import Zone from '../helpers/zone.js';
import Pack from '../helpers/dealer.js';
import InfoBar from '../helpers/infobar.js';
import ButtonBar from '../helpers/buttonbar.js';
import HealthBar from '../helpers/healthbar.js';
//import { io } from "socket.io-client";

//import io from "//cdn.jsdelivr.net/npm/socket.io-client@2/dist/socket.io.js";

export default class Game extends Phaser.Scene {
    
    constructor() {
        super({
            key: 'Game'
        });
        this.thinking = false;
        this.thought = 0;
        this.hosting = false;
        this.multiplayer = false;
    }

    preload() {
        this.load.atlas('cards', 'assets/cards.png', 'assets/cards.json');
        this.load.bitmapFont('gothic2', 'assets/fonts/gothic2.png', 'assets/fonts/gothic.xml');
        this.load.bitmapFont('desyrel', 'assets/fonts/desyrel.png', 'assets/fonts/desyrel.xml');
        this.load.image('clubs', 'assets/clubs.png');
        this.load.image('hearts', 'assets/hearts.png');
        this.load.image('spades', 'assets/spades.png');
        this.load.image('diamonds', 'assets/diamonds.png');
        this.load.image('scores', 'assets/scoresheet.png');
        this.load.image('table', 'assets/darktablegrey.png');
        this.load.image('red', 'assets/red.png');
        this.load.image('yellow', 'assets/yellow.png');
        this.load.image('join', 'assets/people.png');
        this.load.image('play', 'assets/play.png');
        this.load.image('robot_0', 'assets/robot_1.png');
        this.load.image('robot_1', 'assets/robot_1.png');
        this.load.image('robot_2', 'assets/robot_2.png');
        this.load.image('robot_3', 'assets/robot_3.png');
        //this.load.html('nameform', 'src/assets/nameform.html');
        this.load.html('nameform', 'assets/nameform.html');
        //this.load.image('pic', 'assets/pics/turkey-1985086.jpg');
    }

    create() {
        var element;
        var image = this.add.image(640, 450, 'table');

        const p = new Pack();
        p.createPack();       // calling our function to fill our array
        p.shufflePack();
        this.bubbleText = [];     
        let game = this;
        //this.[player] = this.add.bitmapText(this.players[player].x + 107, y, 'gothic2', bidText, 32).setAlpha(0).setDepth(2001);
        // multiplayer server
        this.hostGame = () => {
            this.multiplayer = true;
            //console.log(socket1);
            var socket = io();
            this.socket = socket;
    
            this.socket.on('connect', function () {
                console.log('Connected!');
            }); 
            this.socket.on('connectToRoom', function (datas) {
                //console.log('room connected: '+ datas);
            });
            this.socket.on('reservedSeat', function(seat) {
               console.log('Just learned that seat ' + seat + ' is taken.');
               if (seat != game.mySeat) {
                   avatar[seat].setFillStyle(0x770000); 
                   avatar[seat].setInteractive(false);
               }
            });
            this.socket.on('setName', function (seat, name) {
                console.log('received ' + name + ' from seat ' + seat);
                if (seat != game.mySeat) {
                    game.nameText[seat].setText(name);
                    game.character[seat].setVisible(false);    
                }
            });
            this.socket.on('dealCards', function (seat, rank, suit, value, location = -1) {
                //console.log('received ' + rank + ' of ' + suit); 
                if ((!game.bidding) && (!cleaned)) {
                    //console.log('cleaning up cards');
                    //bBar.hideDealButton();
                    avatar[0].setAlpha(0.75);
                    avatar[1].setAlpha(0.75);
                    avatar[2].setAlpha(0.75);
                    avatar[3].setAlpha(0.75);
                    cleaned = true;
                }
                game.receiveCard(seat, rank, suit, value, location);
            });
            this.socket.on('receivedBidfromServer', function (seat, bid) {
                console.log('The server told me seat ' + seat + ' bid ' + bid);
                game.displayBid(seat, bid);
            });    
            this.socket.on('requestBid', function (seat, highBid, dealer) {
                timeBar[seat].setFillStyle(0x00FF00);
                if ((game.mySeat == seat)) {     // is it me you are looking for?   
                    console.log('received a request to bid'); 
                    game.receiveBidPrompt(highBid, dealer);
                }
            });
            this.socket.on('requestSuit', function (seat, highBid, dealer) {
                if (game.mySeat == seat) {     // is it me you are looking for?
                    console.log('received a request to choose suit'); 
                    highBidder = game.mySeat;
                    bBar.activateSuitButtons(highBid);
                }
            });
            this.socket.on('receivedSuitfromServer', function (highBidder, highBid, bestSuit) {
                console.log('received a request to show suit'); 
                game.showReceivedSuit(highBidder, highBid, bestSuit);
            }); 
            this.socket.on('announceDiscards', function (seat, discards) {
                if (game.mySeat != seat) {     
                    //console.log('received a list of discards from player ' + seat); 
                    game.showReceivedDiscards(seat, discards);
                }
            });
            this.socket.on('yourPlay', function (seat, trump, trumped, leadpoints) {
                // Light up the current player's time bar
                timeBar[seat].setFillStyle(0x00FF00);
                timeBar[(seat + 1) % 4].setFillStyle(0xdddddd);
                timeBar[(seat + 2) % 4].setFillStyle(0xdddddd);
                timeBar[(seat + 3) % 4].setFillStyle(0xdddddd);
                if (seat == game.mySeat) {     
                    //console.log('received a request to play. trump:' + trump + ' leadpoints:' + leadpoints + 'T?:' + trumped); 
                    game.players[game.mySeat].makePlayable(game, trump, trumped, leadpoints);
                }
            });            
            this.socket.on('cardPlayed', function (seat, cardIndex) {
                //console.log('received a request to show a played card'); 
                game.showReceivedPlay(seat, cardIndex);
            });
        
            this.socket.on('trickOver', function (winner) {
                console.log('received trickOver from server. Winner is '+winner);
                game.sweepTrick(winner);
            });         
        
            this.socket.on('updateScore', function (bidderScore, nonBidderScore) {    
                game.scoreDisplay[(highBidder + game.mySeat) % 2].setText(bidderScore);
                game.scoreDisplay[(highBidder + game.mySeat + 1) % 2].setText(nonBidderScore); 
                game.receivedHandOver();
            });    
        
            this.socket.on('misdeal', function () {
               game.receivedHandOver();
            });            
        };

        this.receiveCard = (seat, rank, suit, value, location = -1) => {
            if (seat == 4) {    
                var localSeat = 4;  // leave the kit where it is
            } else {
                var localSeat = seat; //(seat - game.mySeat + 4) % 4;   // shift to show correct orientation (not necessary in this version)
            }
            
            if (location == -1) {   // add to cards or replace what is already there?
                game.players[localSeat].playerCards.push(new Card(suit, rank, value));
                var i = game.players[localSeat].playerCards.length - 1;
            } else {
                //console.log('received ' + rank + ' of ' + suit + ' for ' + seat);
                game.players[localSeat].playerCards[location] = new Card(suit, rank, value);
                var i = location;
            }            
            let suitnames = ['clubs', 'hearts', 'spades', 'diamonds'];
            if (game.dealer == 0) {
                var dealerx = game.players[game.dealer].x;
                var dealery = 1050;
            } else if (game.dealer == 1) {
                var dealerx = -50;
                var dealery = game.players[game.dealer].y;
            } else if (game.dealer == 2) {
                var dealerx = game.players[game.dealer].x;
                var dealery = -125;
            } else {
                var dealerx = 1350;
                var dealery = game.players[game.dealer].y;                    
            }            
            if (seat == game.mySeat) { // Should we show the card face up?
                this.players[localSeat].playerCards[i].render(dealerx, dealery, 'cards', suitnames[game.players[localSeat].playerCards[i].suit]+''+game.players[localSeat].playerCards[i].rank, game);  // render the card below the screen and slide in                
            } else {
                this.players[localSeat].playerCards[i].render(dealerx, dealery, 'cards', 'back', game);
            }

            var targetX = game.players[localSeat].x + (i * 36);
            
            this.players[localSeat].playerCards[i].pic.clearTint().setVisible(true).setDepth(targetX);

            this.tweens.add({   
                targets: game.players[localSeat].playerCards[i].pic,
                x: targetX,
                y: game.players[localSeat].y,
                ease: 'Power1',
                duration: 300,
                delay: i * 50
            });
        }
        
        this.displayBid = (player, thisBid) => {
            var bidText = (thisBid == 0) ? '' : ' ' + thisBid;
            console.log('Displaying bid for player ' + player);
            var y = this.players[player].y - 25;
            
            if (thisBid != 0) {
                this.bubbleText[player].setText(bidText);
                timeBar[player].setFillStyle(0xdddddd);
                let tween = this.add.tween({
                    targets: this.bubbleText[player], duration: 300, ease: 'Exponential.In', alpha : 1,
                    onComplete: () => {
                            timeBar[player].setFillStyle(0xdddddd);
                    }, callbackScope: this
                });        
            } else {
                this.bubbleText[player].setText('');
                let tween = this.add.tween({
                    targets: avatar[player], duration: 300, ease: 'Exponential.In', alpha : 0.2,
                    onComplete: () => {
                            timeBar[player].setFillStyle(0xdddddd);
                    }, callbackScope: this
                });                 
            }

        }
        
        this.nextBid = () => { 
            console.log('entering nextBid and currentPlayer is '+ currentPlayer);
            timeBar[currentPlayer].setFillStyle(0x00FF00);
            var thisBid = 0;
            if (this.players[currentPlayer].isComputer) {
                // find out what the hand is worth
                thisBid = this.players[currentPlayer].aiBid();
                // now let's see if that bid is available and makes sense
                if ((thisBid > highBid) && (currentPlayer != game.dealer)) {
                    // makes sense, this bid is viable
                } else if ((currentPlayer == game.dealer) && (thisBid >= highBid)) {
                    if (highBid > 0) {
                        thisBid = highBid; // Dealer can call
                    } else if (thisBid > 0) {
                        thisBid = 20; // Dealer limps in
                    }
                } else if ((currentPlayer == game.dealer) && (thisBid == 0)) {
                    
                } else {          
                    thisBid = 0;    // have to pass
                }  
                this.displayBid(currentPlayer, thisBid);
                this.registerBid(thisBid);
            } else if (currentPlayer == 0) {    // the host can bid now  
                console.log('Thats me, raise the bid buttons');
                bBar.activateBidButtons(highBid, game.dealer);
            } else if ((game.hosting) && (!this.players[currentPlayer].isComputer)) {
                // invite a guest to bid
                game.socket.emit("requestBid", currentPlayer, highBid, game.dealer);   // ask guest to bid
            }
        }
        
        this.receiveBidPrompt = (highBid, dealer) => {
            bBar.activateBidButtons(highBid, dealer, game.mySeat);
        }
        
        this.registerBid = (thisBid) => {
            console.log('Telling the server that I just bid.');
            game.socket.emit("showBid", game.mySeat, thisBid);   // tell everyone else
        }
        
        var suitSymbol = (suitItem) => {
            if (suitItem == 0) {
                return '&'; //clubs
            } else if (suitItem == 1) {
                return '#'; // hearts
            } else if (suitItem == 2) {
                return '+'; // spades
            } else if (suitItem == 3){
                return '@'; // diamonds
            } else {
                return 'X';
            }
        }
        
        this.trumpCount = (hand, t) => {
            var ticker = 0;
            for (var i = 0; i < hand.length; i++) {
                if ((hand[i].suit == t) || ((hand[i].rank == 'Ace') && (hand[i].suit == 1))) {
                    ticker++;
                }
            }
            return ticker;
        }
          
        this.cardArrayPrint = (cardArray) => {
            var fullArr = '';
            for (var i = 0; i < cardArray.length; i++) {
                if ((cardArray[i].suit) == 0) {
                    var niceSymbol = '♣';
                } else if ((cardArray[i].suit) == 1) {
                    var niceSymbol = '♥';
                } else if ((cardArray[i].suit) == 2) {
                    var niceSymbol = '♠';
                } else {
                    var niceSymbol = '♦';
                }
                fullArr = fullArr + cardArray[i].rank.substring(0,1) + niceSymbol + ' ';
            }
            return fullArr;
        }

        this.playedCards = [];
        this.players = [];
        this.bubbles = [];
        this.nameText = [];
        let scoresheet = this.add.image(1090, 80, 'scores').setScale(0.3).setInteractive();
        
        var score = [0, 0];
        var tricksWon = [0, 0];
        this.scoreDisplay = [];

        this.scoreDisplay.push(this.add.bitmapText(scoresheet.x - 45, scoresheet.y - 10, 'desyrel', score[0], 24).setTint(0x000f55));
        this.scoreDisplay.push(this.add.bitmapText(scoresheet.x + 30, scoresheet.y - 10, 'desyrel', score[1], 24).setTint(0x000f55));
        this.scoreDisplay.push(this.add.bitmapText(scoresheet.x - 50, scoresheet.y - 35, 'desyrel', 'We', 20).setTint(0x000f55));
        this.scoreDisplay.push(this.add.bitmapText(scoresheet.x + 20, scoresheet.y - 35, 'desyrel', 'They', 20).setTint(0x000f55));
        
        this.trickTally = [];
        this.trickTally.push(this.add.text(scoresheet.x - 45, scoresheet.y + 20, '', { fontSize: 16 }).setTint(0x88aaff));
        this.trickTally.push(this.add.text(scoresheet.x + 45, scoresheet.y + 20, '', { fontSize: 16 }).setTint(0x88aaff));
        
        this.players.push(new Player(0, false, 570, 680));
        this.players.push(new Player(1, false, 125, 410));
        this.players.push(new Player(2, false, 570, 150));
        this.players.push(new Player(3, false, 1000, 410));
        this.players.push(new Player(4, false, 1072, 765));
        
        this.dealer = 1;

    
        this.players[0].generate(570, 680, this);
        this.players[1].generate(125, 410, this);
        this.players[2].generate(570, 150, this);
        this.players[3].generate(1000, 410, this);
        this.players[4].generate(1072, 765, this);
      
        var instructions_panel = this.add.rectangle(this.players[0].x + 70, this.players[1].y, 400, 100, 0xffffff);
        instructions_panel.setFillStyle(0x222222).setDepth(2000).setAlpha(0.75);
        this.text3 = this.add.text(515, 390, 'Select a seat', { font: '48px Calibri', fill: '#ffffff' });
        this.text3.setDepth(2001);
        
        var avatar = [];
        var timeBar = [];
        this.bubbleText = [];
        for (let i = 0; i < 4; i++) {   // Initialize the interface
            this.nameText.push(this.add.bitmapText(game.players[i].x - 22, this.players[i].y - 20, 'gothic2', '', 24));
            this.nameText[i].setDepth(2001);
            this.bubbleText.push(this.add.bitmapText(game.players[i].x + 107, game.players[i].y - 25, 'gothic2', '', 32).setAlpha(0).setDepth(2001));
            avatar.push(this.add.rectangle(this.players[i].x + 70, this.players[i].y, 210, 60, 0xffffff));
            avatar[i].setFillStyle(0x222222).setDepth(2000).setAlpha(0.75).setInteractive();
            avatar[i].on('pointerover', function () {
                if (this.fillColor == (0x222222)) {
                    this.setFillStyle(0x00AA00);
                }
            });      
            avatar[i].on('pointerout', function () {
                if (this.fillColor == (0x00AA00)) {
                    this.setFillStyle(0x222222);
                }
            });    
            self = this;
            avatar[i].on('pointerdown', function () {
                this.setFillStyle(0x007700);    // shade green and block the other seats
                avatar[0].disableInteractive();  
                avatar[1].disableInteractive();  
                avatar[2].disableInteractive();  
                avatar[3].disableInteractive();
                game.mySeat = i;
                game.socket.emit('takeSeat', i);    // Tell the server you reserved a seat
                
                self.tweens.add({
                    targets: [self.text3, self.instructions_panel],
                    alpha: 0,
                    yoyo: true,
                    ease: 'Power1',
                    duration: 300,
                    onYoyo: function () {
                            self.text3.setX(485).setY(360).setText("Enter your name");
                            instructions_panel.setY(365).setSize(400,210);
                    },
                    onComplete: function () {
                            var element = self.add.dom(avatar[0].x, avatar[1].y+40).createFromCache('nameform');
                            var el = document.createElement('select');
                            element.setPerspective(800);
                            element.addListener('click');
                            element.on('click', function (event) {
                                if (event.target.name === 'playButton')
                                {
                                    var inputText = this.getChildByName('nameField');
                                    //  Have they entered anything?
                                    if (inputText.value !== '')
                                    {
                                        //  Turn off the click events
                                        this.removeListener('click');
                        
                                        //  Hide the login element
                                        this.setVisible(false);
                                        instructions_panel.setVisible(false);
                                        self.text3.setVisible(false);
                        
                                        //  Populate the name bar with whatever they typed in
                                        game.nameText[i].setText(inputText.value);
                                        game.character[i].setVisible(false);
                                        game.socket.emit('setName', game.mySeat, inputText.value); // Tell the server you now have a name
                                    }
                                    else
                                    {
                                        //  Flash the prompt
                                        this.scene.tweens.add({
                                            //targets: text,
                                            alpha: 0.2,
                                            duration: 250,
                                            ease: 'Power3',
                                            yoyo: true
                                        });
                                    }
                                }
                        
                            });
                    }
                });

            });    
            
            timeBar.push(this.add.rectangle(this.players[i].x + 70, this.players[i].y + 25, 210, 10, 0xffffff));
            timeBar[i].setFillStyle(0xdddddd).setDepth(2001);
            
            
        }
        this.character = [];
        for (let i = 0; i < 4; i++) {
            this.character.push(this.add.image(game.players[i].x + 0, game.players[i].y - 5, 'robot_' + i).setScale(0.3).setDepth(2001));
        }
        
        
        this.took = [0, 0, 0, 0];   // how many extra cards each player asked for
        this.trumpsLeft = [0, 0, 0, 0];
        this.playsIn = 0;
        this.pointsToBeat = 0;
        this.playerToBeat = -1;
        this.bestTrumpValue = 0;
        this.bestTrumpPlayer = -1;
        this.sweepDirection = -1;
        this.whist = false;
        this.leadSuit = -1;
        this.thinking = false;
        this.mySeat = -1;   
     
        
        //var dealerButton = this.add.image(this.players[this.dealer].x - 40, this.players[this.dealer].y + 30, 'play');
        var bBar = new ButtonBar(this, 440, 805);
        var currentPlayer = -1;
        
        var highBid = 0;
        var highBidder = -1;
        var bidsIn = 0;
        var dCount = 0;
        var cleaned = false;
        this.bidding = true;
        this.trickNum = 1;
        var max_depth = 4;  // AI looks max_depth moves ahead
        
        game.hostGame();    // Go initialize connection with the server
        
        this.showSuit = (highBid, bestSuit) => {
            highBidder = game.mySeat;
            game.bidding = false;
            game.bubbleText[highBidder].setText(highBid +suitSymbol(bestSuit));
            game.socket.emit("selectedSuit", game.mySeat, bestSuit);     
        };
        
        this.showReceivedSuit = (hb, highBid, bestSuit) => {
            console.log('processing highBid ' + highBid + ' received suit ' + bestSuit);
            game.bidding = false;
            highBidder = hb; // storing locally in the guest for use later
            game.players[highBidder].bestSuit = bestSuit;
            game.bubbleText[hb].setText(highBid + suitSymbol(bestSuit));
            avatar[0].setAlpha(0.75);
            avatar[1].setAlpha(0.75);
            avatar[2].setAlpha(0.75);
            avatar[3].setAlpha(0.75);
            this.preSelect(highBidder, bestSuit);
            bBar.activateDiscardButton();
        };
        
        this.preSelect = (highBidder, bestSuit) => {
            // pre-select discards as a convenience
            console.log('running pre-select');
            for (var c = 0; c < 5; c++) {
                if (((game.players[game.mySeat].playerCards[c].suit) != bestSuit) && (game.players[game.mySeat].playerCards[c].suit + '' + game.players[game.mySeat].playerCards[c].rank != '1Ace')) {
                    game.players[game.mySeat].playerCards[c].scrap();
                }
            }

            for (c = 0; c < 3; c++) {
                // show kit cards to the highBidder
                if (game.mySeat == highBidder) {
                    console.log('showing KIT because ' + game.mySeat + ' == ' + highBidder);
                    game.players[4].playerCards[c].flipUp();
                    // pre-select discards from the kit
                    if (((game.players[4].playerCards[c].suit) != bestSuit) && (game.players[4].playerCards[c].suit + '' + game.players[4].playerCards[c].rank != '1Ace')) {
                        game.players[4].playerCards[c].scrap();
                    }
                }

            }
        }
        
        this.lockInDiscards = () => {
            let discards = [];
            let cardsToPickUp = [];
            // Now let's see what is actually discarded
            if (game.mySeat == highBidder) {
                var k = 0;
                for (var c = 0; c < 5; c++) {
                    if (game.players[game.mySeat].playerCards[c].isScrapped()) {    // then pull in some kit cards to replace them
                        console.log('card '+c+' discarded');
                        discards.push(c); 
                        game.players[game.mySeat].playerCards[c].pic.setVisible(false);
                        while ((k < 3) && (game.players[4].playerCards[k].isScrapped())) {
                            k++;
                        }
                        if (k < 3) {
                            console.log('card '+c+' replaced with kit card '+k);
                            var newX = game.players[game.mySeat].playerCards[c].pic.x;
                            var newY = game.players[game.mySeat].playerCards[c].pic.y;
                            
                            game.players[game.mySeat].playerCards[c] = game.players[4].playerCards[k];              // copy the kit card into the local copy of the hand
                            cardsToPickUp.push(k);                                                                  // and now tell the server you have it   
                            game.players[game.mySeat].playerCards[c].pic.setVisible(true);       
                            game.tweens.add({   // slide it over to the empty space in the highBidder hand
                                targets: game.players[game.mySeat].playerCards[c].pic,
                                x: newX,
                                y: newY,
                                depth: newX,
                                ease: 'Power1',
                                duration: 300
                            });                        
                            k++;
                        }
                    }
                }
                // now tell the server which cards to subtract
                game.socket.emit("announceDiscards", game.mySeat, discards);   
                game.socket.emit('tookCardsFromKit', cardsToPickUp);
            } else {    // for the rest of the players
                for (var c = 0; c < 5; c++) {
                    if (game.players[game.mySeat].playerCards[c].isScrapped()) {
                        game.players[game.mySeat].playerCards[c].pic.setVisible(false);
                        discards.push(c); 
                    }
                }
                game.socket.emit("announceDiscards", game.mySeat, discards); 
            }

    
            /*if (game.mySeat == highBidder) {    // Let's see what we discarded from the kit as well
                for (var c = 0; c < 3; c++) {
                    if (game.players[4].playerCards[c].isScrapped()) {
                        game.players[4].playerCards[c].pic.setVisible(false);
                        discards.push(c);
                    }
                }
                // now tell the server which kit cards to subtract
                game.socket.emit("announceDiscards", 4, discards); 
            }*/
  
        }
        
        this.showReceivedDiscards = (seat, discards) => {
            let localSeat = seat; 
            console.log('processing discards received from seat ' + seat + '. and i am ' + game.mySeat);
            for (let i = 0; i < discards.length; i++) {
                game.players[localSeat].playerCards[discards[i]].pic.setVisible(false);
            }
            if (seat == highBidder) {   // Hide the kit cards as they have already been processed
                for (var k = 0; k < 3; k++) {
                    game.players[4].playerCards[k].pic.setVisible(false);
                }
            }
        }

        this.showReceivedPlay = (seat, cardIndex) => {
            game.playedCards.unshift(game.players[seat].playerCards[cardIndex]);
            game.players[seat].playerCards[cardIndex].setPlayed();
            timeBar[seat].setFillStyle(0xffffff);
            game.playsIn++;
            game.players[seat].slideItIn(game, cardIndex);    
        }
        
        this.sweepTrick = (winner) => {
            //game.sweepDirection = winner;  deprecated
            this.trickTally[(winner + game.mySeat) % 2].setText(this.trickTally[(winner + game.mySeat) % 2].text + '★');
            game.playsIn = 0;
            //game.sweepDirection = -1; deprecated
            let myTargets = [];
            for (let i = 0; ((i < game.playedCards.length) && (i < 4)); i++) {
                myTargets.push(game.playedCards[i].pic);
            }
            console.log('sweeping targets (' + myTargets.length + '): ' + game.cardArrayPrint(game.playedCards));
            //console.log(game.cardArrayPrint(game.players[0].playerCards) + '  ' + game.cardArrayPrint(game.players[1].playerCards) + '  ' + game.cardArrayPrint(game.players[2].playerCards) + '  ' + game.cardArrayPrint(game.players[3].playerCards));
            
            game.tweens.add({
                targets: myTargets,
                x: game.bubbleText[winner].x,
                y: game.bubbleText[winner].y + 70,  // line up with cards
                ease: 'Power1',
                duration: 300,  // how fast they sweep away
                delay: 700, // how long to wait in the middle
                onStart: function () {              // notify the server that the board is clear and then add sparkles
                    for (let i = 0; i < 4; i++) {
                        if (i == game.mySeat) {
                            game.socket.emit('boardClear', game.mySeat);        
                        }
                    }
                    game.players[winner].lightUp(this, myTargets, winner, game);
                },
                onComplete: function () {
                    for (let i = 0; i < myTargets.length; i++) {
                        myTargets[i].setVisible(false);     // erase the swept cards
                    } 
                }
            }); 
        }            

 /*       this.handOver = () => {
            console.log('hand over');
            p.shufflePack();
            game.bestTrumpValue = 0;

            this.players[0].playerCards = p.cards.slice(0, 5);  // replace with an addCards() method?
            this.players[1].playerCards = p.cards.slice(5, 10);
            this.players[2].playerCards = p.cards.slice(10, 15);
            this.players[3].playerCards = p.cards.slice(15, 20);
            this.players[4].playerCards = p.cards.slice(20, 23); // kitty
            this.dealer = (this.dealer + 1) % 4;  // move the dealer along
            currentPlayer = (game.dealer + 1) % 4;            
            this.players[0].generate(570, 680, this);
            this.players[1].generate(125, 410, this);
            this.players[2].generate(570, 150, this);
            this.players[3].generate(1000, 410, this);
            this.players[4].generate(1072, 765, this);
            for (let i = 0; i < 4; i++) {
                game.bubbleText[i].setText('');    
                avatar[i].setAlpha(0.75);
            }


            this.trickTally[0].setText();
            this.trickTally[1].setText();
            this.playedCards = [];
            tricksWon = [0, 0];
            game.playsIn = 0;
            highBid = 0;
            dCount = 0;
            
            bidsIn = 0;
            bBar.activateDealButton(null, [bBar.buttons[0], bBar.buttons[1], bBar.buttons[2], bBar.buttons[3]], game, bBar.r, false);    
            this.trickNum = 1;  
            if (game.multiplayer) {
                game.socket.emit("updateScore", score[highBidder % 2], score[(highBidder + 1) % 2]);    
            }
            
        }
   */     
        this.receivedHandOver = () => {
            this.trickTally[0].setText();
            this.trickTally[1].setText();
            this.playedCards = [];

            game.playsIn = 0;
            game.bidding = true;
            cleaned = false;

            for (let a = 0; a < 5; a++) {
                for (let b = 0; b < game.players[a].playerCards.length; b++) {
                    game.tweens.add({
                        targets: [game.players[a].playerCards[b].pic],
                        x: 1,
                        y: 1000,
                        ease: 'Power1',
                        delay: 500,
                        duration: 750
                    });
                }
                game.players[a].playerCards = [];
            }
            game.bubbleText[0].setText('');
            game.bubbleText[1].setText('');
            game.bubbleText[2].setText('');
            game.bubbleText[3].setText(''); 
        }
    }
    
    update() {

    }
}