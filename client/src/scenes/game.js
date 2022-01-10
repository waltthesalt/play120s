import Card from '../helpers/card.js';
import Player from '../helpers/player.js';
import Zone from '../helpers/zone.js';
import Pack from '../helpers/dealer.js';
import InfoBar from '../helpers/infobar.js';
import ButtonBar from '../helpers/buttonbar.js';
import HealthBar from '../helpers/healthbar.js';
import { io } from "socket.io-client";
//const socket = io(`http://localhost:8082`);

var socket = io('http://localhost:8082', {transports: ['http']});
socket.on('connect', function () {
  console.log('connected!');
  socket.emit('greet', { message: 'Hello Mr.Server!' });
});

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
        this.load.atlas('cards', 'src/assets/cards.png', 'src/assets/cards.json');
        this.load.bitmapFont('gothic2', 'src/assets/fonts/gothic2.png', 'src/assets/fonts/gothic.xml');
        this.load.bitmapFont('desyrel', 'src/assets/fonts/desyrel.png', 'src/assets/fonts/desyrel.xml');
        this.load.image('clubs', 'src/assets/clubs.png');
        this.load.image('hearts', 'src/assets/hearts.png');
        this.load.image('spades', 'src/assets/spades.png');
        this.load.image('diamonds', 'src/assets/diamonds.png');
        this.load.image('scores', 'src/assets/scoresheet.png');
        this.load.image('table', 'src/assets/darktablegrey.png');
        this.load.image('red', 'src/assets/red.png');
        this.load.image('yellow', 'src/assets/yellow.png');
        this.load.image('join', 'src/assets/people.png');
        this.load.image('play', 'src/assets/play.png');
        this.load.image('robot_0', 'src/assets/robot_1.png');
        this.load.image('robot_1', 'src/assets/robot_1.png');
        this.load.image('robot_2', 'src/assets/robot_2.png');
        this.load.image('robot_3', 'src/assets/robot_3.png');
        //this.load.html('nameform', 'src/assets/nameform.html');
        this.load.html('nameform', 'src/assets/nameform.html');
        //this.load.image('pic', 'assets/pics/turkey-1985086.jpg');
    }

    create() {
        var element;

        //this.add.image(400, 300, 'pic');
        var image = this.add.image(640, 450, 'table');

        //var text = this.add.text(10, 10, 'Please login to play', { color: 'white', fontFamily: 'Arial', fontSize: '32px '});
/*
        

        element.on('click', function (event) {

            if (event.target.name === 'loginButton')
            {
                var inputUsername = this.getChildByName('username');
                var inputPassword = this.getChildByName('password');

                //  Have they entered anything?
                if (inputUsername.value !== '' && inputPassword.value !== '')
                {
                    //  Turn off the click events
                    this.removeListener('click');

                    //  Tween the login form out
                    this.scene.tweens.add({ targets: element.rotate3d, x: 1, w: 90, duration: 3000, ease: 'Power3' });

                    this.scene.tweens.add({ targets: element, scaleX: 2, scaleY: 2, y: 700, duration: 3000, ease: 'Power3',
                        onComplete: function ()
                        {
                            element.setVisible(false);
                        }
                    });

                    //  Populate the text with whatever they typed in as the username!
                    //text.setText('Welcome ' + inputUsername.value);
                }
                else
                {
                    //  Flash the prompt
                    //this.scene.tweens.add({ targets: text, alpha: 0.1, duration: 200, ease: 'Power3', yoyo: true });
                }
            }

        });

        this.tweens.add({
            targets: element,
            y: 450,
            duration: 3000,
            ease: 'Power3'
        });
*/        
        
        const p = new Pack();
        p.createPack();       // calling our function to fill our array
        p.shufflePack();
        this.bubbleText = [];     
        let game = this;

        // multiplayer server
        this.hostGame = () => {
            this.multiplayer = true;
            //console.log(socket1);
            this.socket = socket;

            this.socket.on('connect', function () {
                console.log('Connected!');
            }); 
            this.socket.on('connectToRoom', function (datas) {
                //console.log('room connected: '+ datas);
            });
            this.socket.on('tookSeat', function (whichSeat) {
                if (whichSeat == 0) {
                    if (!game.hosting) {
                        game.hosting = true;    // this is the host (master)
                        game.mySeat = whichSeat;
                        console.log('taking host position');
                                               
                    }
                } else {
                    if (game.hosting) {
                        // I am the host and someone joined me
                        game.players[whichSeat].isComputer = false;
                    } else {
                        if (game.mySeat == -1) {    // not set yet
                            // I am a guest, so go into receive mode
                            game.mySeat = whichSeat;
                            game.players[0].playerCards = [];
                            game.players[1].playerCards = [];
                            game.players[2].playerCards = [];
                            game.players[3].playerCards = [];
                            game.players[4].playerCards = [];
                            bBar.hideDealButton();
                            console.log('taking guest position');
                        }
                    }
                }
                if (whichSeat == game.mySeat) {
                    var element = game.add.dom(220, 120, 100).createFromCache('nameform');
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

                                //  Populate the text with whatever they typed in
                                game.socket.emit("setName", game.mySeat, inputText.value);
                            }
                            else
                            {
                                //  Flash the prompt
                                this.scene.tweens.add({
                                    targets: text,
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
            this.socket.on('setName', function (seat, name) {
                console.log('received ' + name + ' from seat ' + seat);
                game.nameText[(seat - game.mySeat + 4) % 4].setText(name);
                if (seat != game.mySeat) {
                    game.character[(seat - game.mySeat + 4) % 4 - 1].setVisible(false);    
                }
                //game.scale.setGameSize(1280, 900);
            });
            this.socket.on('dealCards', function (seat, rank, suit, value, location = -1) {
                if (!game.hosting) {
                    //console.log('received ' + rank + ' of ' + suit); 
                    if ((!game.bidding) && (!cleaned)) {
                        console.log('cleaning up cards');
                        bBar.hideDealButton();
                        avatar[0].setAlpha(0.75);
                        avatar[1].setAlpha(0.75);
                        avatar[2].setAlpha(0.75);
                        avatar[3].setAlpha(0.75);
                        game.players[4].playerCards[0].pic.setVisible(false);
                        game.players[4].playerCards[1].pic.setVisible(false);
                        game.players[4].playerCards[2].pic.setVisible(false);
                        cleaned = true;
                    }
                    game.receiveCard(seat, rank, suit, value, location);
                }
            });
            this.socket.on('showBid', function (seat, bid) {
                // a bid came in from another real player
                if (((game.hosting) && (seat != 0) && (!game.players[seat].isComputer)) || ((!game.hosting) && (seat != game.mySeat))) {
                    console.log('received ' + bid + ' from ' + seat);
                    game.receiveBid(seat, bid);
                }
            });    
            this.socket.on('requestBid', function (seat, highBid, dealer) {
                timeBar[(seat - game.mySeat +4) % 4].setFillStyle(0x00bb00);
                if ((!game.hosting) && (game.mySeat == seat)) {     // is it me you are looking for?
                    console.log('received a request to bid'); 
                    game.receiveBidPrompt(highBid, dealer);
                }
            });
            this.socket.on('requestSuit', function (seat, highBid) {
                if ((!game.hosting) && (game.mySeat == seat)) {     // is it me you are looking for?
                    console.log('received a request to choose suit'); 
                    highBidder = game.mySeat;
                    bBar.activateSuitButtons(highBid);
                }
            });
            this.socket.on('showSuit', function (seat, highBidder, highBid, bestSuit) {
                if (game.mySeat != seat) /* && (!game.players[seat].isComputer)) */ {     
                    console.log('received a request to show suit'); 
                    game.showReceivedSuit(highBidder, highBid, bestSuit);
                }
            }); 
            this.socket.on('announceDiscards', function (seat, discards) {
                if (game.mySeat != seat) {     
                    //console.log('received a list of discards from player ' + seat); 
                    game.showReceivedDiscards(seat, discards);
                }
            });
            this.socket.on('yourPlay', function (seat, trump, trumped, leadpoints) {
                timeBar[(seat - game.mySeat + 4) % 4].setFillStyle(0x00bb00);
                timeBar[(seat - game.mySeat + 5) % 4].setFillStyle(0xdddddd);
                timeBar[(seat - game.mySeat + 6) % 4].setFillStyle(0xdddddd);
                timeBar[(seat - game.mySeat + 7) % 4].setFillStyle(0xdddddd);
                if (seat == game.mySeat) {     
                    //console.log('received a request to play. trump:' + trump + ' leadpoints:' + leadpoints + 'T?:' + trumped); 
                    game.players[0].makePlayable(game, trump, trumped, leadpoints);
                }
            });            
            this.socket.on('cardPlayed', function (seat, cardIndex) {
                //console.log('received a request to show a played card'); 
                game.showReceivedPlay(seat, cardIndex);
            });
            this.socket.on('trickOver', function (winner) {
                console.log('received trickOver from server. game.hosting=' + game.hosting);
                game.reactToTrickOver(winner);
            });         
            
            this.socket.on('startNextTrick', function () {
               if (game.hosting) {
                   game.time.delayedCall(100, this.nextPlay, [0, -1, false], game);
               } 
            });
            this.socket.on('updateScore', function (bidderScore, nonBidderScore) {    
                if (!game.hosting) {
                    //game.receivedHandOver();
                    game.scoreDisplay[(highBidder + game.mySeat) % 2].setText(bidderScore);
                    game.scoreDisplay[(highBidder + game.mySeat + 1) % 2].setText(nonBidderScore); 
                }
            });    
            this.socket.on('misdeal', function () {
               if (!game.hosting) {
                   game.receivedHandOver();
               } 
            });            
        }
        
        this.distributeCards = () => {  // first time filling hands, host only function
            console.log('distributing cards');
            for (var cd = 0; cd < 5; cd++) {
                for (var pl = 0; pl < 5; pl++) {
                    if (((this.dealer + 1 + pl) % 5 < 4) || (cd < 3)) { // don't put too many in kit
                        this.players[(this.dealer + 1 + pl) % 5].playerCards[cd].pic.setDepth(this.players[(this.dealer + 1 + pl) % 5].x + cd * 36);
                        this.players[(this.dealer + 1 + pl) % 5].playerCards[cd].recover();
                        if (game.hosting) {
                            // send the card to the server to tell the others
                            game.socket.emit("dealCards", (this.dealer + 1 + pl) % 5, game.players[(this.dealer + 1 + pl) % 5].playerCards[cd].rank, game.players[(this.dealer + 1 + pl) % 5].playerCards[cd].suit, game.players[(this.dealer + 1 + pl) % 5].playerCards[cd].value);
                        }
                        this.tweens.add({   
                            targets: game.players[(this.dealer + 1 + pl) % 5].playerCards[cd].pic,
                            x: game.players[(this.dealer + 1 + pl) % 5].x + cd * 36,
                            y: game.players[(this.dealer + 1 + pl) % 5].y,
                            ease: 'Power1',
                            duration: 300,
                            delay: cd * 200 + pl * 30
                        });
                    }
                }
            }
            game.bidding = true;
            let timer = game.time.delayedCall(cd * 200 + pl * 30, this.nextBid, {}, game);
        }
        
        this.receiveCard = (seat, rank, suit, value, location = -1) => {
            if (seat == 4) {    
                var localSeat = 4;  // leave the kit where it is
            } else {
                var localSeat = (seat - game.mySeat + 4) % 4;   // shift to show correct orientation
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
            } else if (scene.dealer == 2) {
                var dealerx = game.players[game.dealer].x;
                var dealery = -125;
            } else {
                var dealerx = 1350;
                var dealery = game.players[game.dealer].y;                    
            }            
            if (localSeat == 0) {
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
        
        this.receiveBid = (seat, bid) => {
            var localSeat = (seat - game.mySeat + 4) % 4;   // shift to show correct orientation
            this.displayBid(localSeat, bid);
            if (game.hosting) { // record this bid because you are holding the master record
                this.registerBid(bid);
            }
        }
        
        this.displayBid = (player, thisBid) => {
            var bidText = (thisBid == 0) ? '' : ' ' + thisBid;
            var y = this.players[player].y - 25;
            if (this.bubbleText[player]) {
                this.bubbleText[player].destroy();
            }
            if (thisBid != 0) {
                this.bubbleText[player] = this.add.bitmapText(this.players[player].x + 107, y, 'gothic2', bidText, 32).setAlpha(0).setDepth(2001);
                timeBar[player].setFillStyle(0xdddddd);
                let tween = this.add.tween({
                    targets: this.bubbleText[player], duration: 300, ease: 'Exponential.In', alpha : 1,
                    onComplete: () => {
                            timeBar[player].setFillStyle(0xdddddd);
                            if ((game.hosting) || (!game.multiplayer)) {
                                if (game.bidding) {
                                    this.nextBid(); // this timer keeps the bidding moving
                                    return;
                                } else if (game.misdeal) {
                                    return;
                                } else {
                                    // Bidding is complete, time to move on to suit selection
                                    this.selectSuit();
                                }
                            }
                    }, callbackScope: this
                });        
            } else {
                this.bubbleText[player] = this.add.bitmapText(this.players[player].x + 107, y, 'gothic2', '-', 32).setAlpha(0).setDepth(2001);
                let tween = this.add.tween({
                    targets: avatar[player], duration: 300, ease: 'Exponential.In', alpha : 0.2,
                    onComplete: () => {
                            timeBar[player].setFillStyle(0xdddddd);
                            if ((game.hosting) || (!game.multiplayer)) {
                                if (game.bidding) {
                                    this.nextBid(); // this timer keeps the bidding moving
                                    return;
                                } else if (game.misdeal) {
                                    return;
                                } else {
                                    // Bidding is complete, time to move on to suit selection
                                    this.selectSuit();
                                }
                            }
                    }, callbackScope: this
                });                 
            }

        }
        
        this.nextBid = () => { 
            console.log('entering nextBid and currentPlayer is '+ currentPlayer);
            timeBar[currentPlayer].setFillStyle(0x00bb00);
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
            bBar.activateBidButtons(highBid, dealer);
        }
        
        this.registerBid = (thisBid) => {
            if ((!game.multiplayer) || (game.hosting)) {
                //this.displayBid(currentPlayer, thisBid);
                if ((game.hosting) && ((game.players[currentPlayer].isComputer) || currentPlayer == 0)) { 
                    game.socket.emit("showBid", currentPlayer, thisBid);   // tell everyone else
                }
                if (thisBid > highBid) {    // a new high bid
                    if (currentPlayer != game.dealer) {
                        highBid = thisBid;
                        highBidder = currentPlayer;
                    } else {
                        game.bidding = false;    // dealer raised
                        highBidder = game.dealer;
                        highBid = thisBid;
                        return;
                    }
                }
                bidsIn++;
                console.log('Player ' + currentPlayer + ' bids ' + thisBid + '. High bidder = ' + highBidder);
                if (bidsIn < 4) {
                    // early bidding, move around the table
                    currentPlayer = (currentPlayer + 1) % 4;
                } else if ((highBid == 0) && (thisBid == 0)) {
                    // misdeal
                    console.log('misdeal?');
                    game.bidding = false;
                    game.misdeal = true;
                    
                    for (var n = 0; n < 4; n++) {
                        for (var g = 0; g < 5; g++) {
                            game.tweens.add({
                                targets: [this.players[n].playerCards[g].pic],
                                x: 1,
                                y: 1000,
                                ease: 'Power1',
                                delay: 100,
                                duration: 500
                            });
                        }
                    }  
                    for (g = 0; g < 3; g++) {
                        game.tweens.add({
                            targets: [this.players[4].playerCards[g].pic],
                            x: 1,
                            y: 1000,
                            ease: 'Power1',
                            delay: 100,
                            duration: 500
                        });
                    }

                    bBar.hideBidButtons(game);
                    var timer = game.time.delayedCall(700, this.handOver, {}, this);
                    var timer2 = game.time.delayedCall(850, function () {
                        game.socket.emit("misdeal"); 
                    }, {}, this);
                    return;
                } else if ((currentPlayer == highBidder) && (thisBid == 0)) {
                    // highbidder backed down, we are done;
                    game.bidding = false;
                    console.log('We are done because the highbidder backed down.')
                    highBidder = game.dealer;
                } else if ((currentPlayer == game.dealer) && (thisBid == 0)) {
                    // dealer backed down, we are done;
                    game.bidding = false;
                    console.log('We are done because the dealer backed down.')           
                } else if ((bidsIn % 2 == 0) && (thisBid == highBid)) {
                    console.log(bidsIn + ' bids in, going to highbidder ' + highBidder);
                    // highbidder was called, go back to the highbidder
                    currentPlayer = highBidder;
                } else if (bidsIn % 2 == 1) {
                    console.log(bidsIn + ' bids in, going to dealer ' + game.dealer);
                    currentPlayer = game.dealer;
                }
            } else {
                // I am a guest
                //this.displayBid(0, thisBid);    // show myself the bid and send out
                console.log('I am a guest and I just bid');
                game.socket.emit("showBid", game.mySeat, thisBid);   // tell everyone else
            }
            
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
            console.log(fullArr);
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
        
        this.players.push(new Player(0, false));
        this.players.push(new Player(1, true));
        this.players.push(new Player(2, true));
        this.players.push(new Player(3, true));
        this.players.push(new Player(4, true));
        
        this.players[0].playerCards = p.cards.slice(0, 5);  // replace with an addCards() method
        this.players[1].playerCards = p.cards.slice(5, 10);
        this.players[2].playerCards = p.cards.slice(10, 15);
        this.players[3].playerCards = p.cards.slice(15, 20);
        this.players[4].playerCards = p.cards.slice(20, 23); // kitty
        this.dealer = Phaser.Math.RND.integerInRange(0, 3);
        
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
        for (let i = 0; i < 4; i++) {
            this.nameText.push(this.add.bitmapText(game.players[i].x - 22, this.players[i].y - 20, 'gothic2', '', 24));
            this.nameText[i].setDepth(2001);
            avatar.push(this.add.rectangle(this.players[i].x + 70, this.players[i].y, 210, 60, 0xffffff));
            avatar[i].setFillStyle(0x222222).setDepth(2000).setAlpha(0.75).setInteractive();
            avatar[i].on('pointerover', function () {
                this.setFillStyle(0x00AA00);
            });      
            avatar[i].on('pointerout', function () {
                this.setFillStyle(0x222222);
            });    
            self = this;
            avatar[i].on('pointerdown', function () {
                this.setFillStyle(0x00EE00);
                this.removeInteractive();
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
                                        game.hostGame(); // go connect to server
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
        var currentPlayer = (this.dealer + 1) % 4;
        
        var highBid = 0;
        var highBidder = -1;
        var bidsIn = 0;
        var dCount = 0;
        var cleaned = false;
        this.bidding = true;
        this.trickNum = 1;
        var max_depth = 4;  // AI looks max_depth moves ahead
        
        //this.nextBid();    
                      
        this.selectSuit = () => {
            if (game.players[highBidder].isComputer) {
                // show chosen trump suit
                for (var i = 0;i < 4;i++) {
                    if (i == highBidder) {
                        // show the trump suit
                        this.showSuit(highBid, game.players[highBidder].bestSuit);
                        console.log('calling showSuit with ' + highBid);
                    } else {
                        game.bubbleText[i].destroy();
                    }
                }
            } else if (highBidder == 0) {
                // show suit buttons
                bBar.activateSuitButtons(highBid);
            } else if (game.multiplayer) {
                // ask guest for the suit
                game.socket.emit("whichSuit", highBidder, highBid); 
            }
        }
        
        this.showSuit = (highBid, bestSuit) => {
            if ((!game.multiplayer) || (game.hosting)) {    // show and maybe send out
                game.bubbleText[highBidder].setText(highBid + suitSymbol(bestSuit));
                game.bubbleText[(highBidder + 1) % 4].destroy();
                game.bubbleText[(highBidder + 2) % 4].destroy();
                game.bubbleText[(highBidder + 3) % 4].destroy();
                if (game.multiplayer) { // tell the guests
                    game.socket.emit("showSuit", game.mySeat, highBidder, highBid, bestSuit);      
                }
                this.preSelect(highBidder, bestSuit);
                bBar.activateDiscardButton();
                for (let i = 1; i < 4; i++) {
                    avatar[(highBidder + i) % 4].setAlpha(0.75);
                }
            } else if (game.multiplayer) { // I am a guest and I just selected the suit
                highBidder = game.mySeat;
                game.bidding = false;
                game.bubbleText[0].setText(highBid +suitSymbol(bestSuit));
                for (let i = 1; i < 4; i++) {
                    game.bubbleText[i].destroy();
                    avatar[i].setAlpha(0.75);
                }
                game.socket.emit("showSuit", game.mySeat, game.mySeat, highBid, bestSuit);     
                this.preSelect(highBidder, bestSuit);
                bBar.activateDiscardButton();
            }     

        }
        
        this.showReceivedSuit = (hb, highBid, bestSuit) => {
            let localSeat = (hb - game.mySeat + 4) % 4; 
            console.log('processing highBid ' + highBid + ' received suit ' + bestSuit);
            game.bidding = false;
            highBidder = hb; // storing locally in the guest for use later
            game.players[highBidder].bestSuit = bestSuit;
            game.bubbleText[localSeat].setText(highBid + suitSymbol(bestSuit));
            game.bubbleText[(localSeat + 1) % 4].setText('');
            game.bubbleText[(localSeat + 2) % 4].setText('');
            game.bubbleText[(localSeat + 3) % 4].setText(''); 
            avatar[0].setAlpha(0.75);
            avatar[1].setAlpha(0.75);
            avatar[2].setAlpha(0.75);
            avatar[3].setAlpha(0.75);
            this.preSelect(highBidder, bestSuit);
            bBar.activateDiscardButton();
        }
        
        this.preSelect = (highBidder, bestSuit) => {
            // pre-select discards as a convenience
            console.log('running pre-select');
            let discards = [];
            for (var p = 0; ((p < 1) || ((p < 4) && (game.hosting))); p++) {
                if ((p == 0) || (game.hosting && (game.players[p].isComputer))) {
                    for (var c = 0; c < 5; c++) {
                        if (((game.players[p].playerCards[c].suit) != bestSuit) && (game.players[p].playerCards[c].suit + '' + game.players[p].playerCards[c].rank != '1Ace')) {
                            game.players[p].playerCards[c].scrap();
                            if (game.players[p].isComputer) {
                                game.players[p].playerCards[c].pic.setVisible(false);
                                discards.push(c);
                            }
                        }
                    }
                    if ((game.players[p].isComputer) && (game.hosting)) {
                        dCount++;   // count the computers as having completed their discards
                    }
                }
                if ((discards.length > 0) && (game.hosting)) {  // host will announce computer discards
                    game.socket.emit("announceDiscards", p, discards);
                }
                discards = [];
            }
            for (c = 0; c < 3; c++) {
                // show kit cards to the highBidder
                if (game.mySeat == highBidder) {
                    console.log('showing KIT because ' + game.mySeat + ' == ' + highBidder);
                    game.players[4].playerCards[c].flipUp(game.players[4].playerCards[c].pic.x, game.players[4].playerCards[c].pic.y, game);
                }
                // pre-select discards from the kit
                if (((game.players[4].playerCards[c].suit) != bestSuit) && (game.players[4].playerCards[c].suit + '' + game.players[4].playerCards[c].rank != '1Ace')) {
                    game.players[4].playerCards[c].scrap();
                }
            }
        }
        
        this.lockInDiscards = () => {
            let discards = [];
            for (var c = 0; c < 5; c++) {
                if (game.players[0].playerCards[c].isScrapped()) {
                    game.players[0].playerCards[c].pic.setVisible(false);
                    discards.push(c);
                }
            }
            console.log('i think the highBidder is ' + highBidder);
            if (highBidder == game.mySeat) {
                for (var c = 0; c < 3; c++) {
                    if (game.players[4].playerCards[c].isScrapped()) {
                        game.players[4].playerCards[c].pic.setVisible(false);
                    }
                }                
            }
            // now tell the others which cards to subtract
            if (game.multiplayer) {
                game.socket.emit("announceDiscards", game.mySeat, discards);   
                if (game.hosting) {
                    dCount++;   // need all four to finish
                    console.log(dCount + ' players are ready to move on');
                    if (dCount == 4) { this.fillHands(); }
                } 
            } else {
                this.fillHands();
            }
        }
        
        this.showReceivedDiscards = (seat, discards) => {
            let localSeat = (seat - game.mySeat + 4) % 4; 
            console.log('processing discards received from seat ' + seat + '. and i am ' + game.mySeat);
            for (let i = 0; i < discards.length; i++) {
                game.players[localSeat].playerCards[discards[i]].pic.setVisible(false);
            }
            if ((game.hosting) && (!game.players[seat].isComputer)) {
                dCount++;   // need all four to finish
                console.log(dCount + ' players are ready to move on');
                if (dCount == 4) { this.fillHands(); }
            }
        }
        
        this.fillHands = () => {    // this is a host only function
            // first get the kit cards
            var pl = highBidder;
            var k = 0;
            for (var c = 0; ((c < 5) && (k < 3)); c++) {

                if ((game.players[pl].playerCards[c].isScrapped()) || (!game.players[pl].playerCards[c].pic.visible)) {
                    game.players[pl].playerCards[c].pic.setVisible(false);  // erase discards
                    //console.log('card ' + c + ' is scrapped');
                    while ((k < 3) && (game.players[4].playerCards[k].isScrapped())) {
                        k++;
                    }
                    if (k == 3) { break; }
                    
             /*       if (pl == 0) {    // if I'm the highBidder
                        game.players[4].playerCards[k].flipUp(game.players[4].playerCards[k].pic.x, game.players[4].playerCards[k].pic.y, this);
                    }
                    */
                    game.players[4].playerCards[k].pic.setDepth(game.players[pl].playerCards[c].pic.x);
                    game.tweens.add({   // slide in the chosen kit card
                        targets: game.players[4].playerCards[k].pic,
                        x: game.players[pl].playerCards[c].pic.x,
                        y: game.players[pl].playerCards[c].pic.y,
                        ease: 'Power1',
                        duration: 300

                    });
                    //game.players[pl].playerCards[c].pic.setVisible(false); // remove scrapped card
                    game.players[pl].playerCards[c] = game.players[4].playerCards[k]; // replace
                    // send the card to the server to tell the others
                    if (game.multiplayer) {
                        game.socket.emit("dealCards", pl, game.players[pl].playerCards[c].rank, game.players[pl].playerCards[c].suit, game.players[pl].playerCards[c].value, c);
                    }
                    k++;
                } 
            }
            for (k = 0; k < 3; k++) {   // clean up any that were left behind
                if (game.players[4].playerCards[k].isScrapped()) {
                    game.players[4].playerCards[k].pic.setVisible(false);
                }
            }
            
            // Now draw cards from the pack
            var topPack = 23;   // next card to draw out
            var suitnames = ['clubs', 'hearts', 'spades', 'diamonds'];
            for (var i = 0; i < 4; i++) {
                pl = (game.dealer + 1 + i) % 4;
                for (var c = 0; c < 5; c++) {
                    if ((game.players[pl].playerCards[c].isScrapped()) || (!game.players[pl].playerCards[c].pic.visible)) {
                        //console.log('card ' + c + ' is scrapped');
                        game.players[pl].playerCards[c].pic.setVisible(false); // remove scrapped card
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
                        if (pl != 0) {
                            p.cards[topPack].render(dealerx, dealery, 'cards', 'back', this);    
                        } else {
                            p.cards[topPack].render(dealerx, dealery, 'cards', suitnames[p.cards[topPack].suit]+''+p.cards[topPack].rank, this);
                        }
                        
                        p.cards[topPack].pic.setDepth(game.players[pl].playerCards[c].pic.x);
                        
                        game.tweens.add({   // slide in the card from the pack
                            targets: p.cards[topPack].pic,
                            x: game.players[pl].playerCards[c].pic.x,
                            y: game.players[pl].playerCards[c].pic.y,
                            ease: 'Power1',
                            duration: 300,
                            delay: (topPack - 22) * 50    // go sequentially
                        });
                        game.players[pl].playerCards[c] = p.cards[topPack]; // replace
                        // send the card to the server to tell the others
                        if (game.multiplayer) {
                            game.socket.emit("dealCards", pl, game.players[pl].playerCards[c].rank, game.players[pl].playerCards[c].suit, game.players[pl].playerCards[c].value, c);    // this will trigger showReceivedCards
                        }
                        game.took[pl]++;
                        topPack++;
                    }
                    if (pl == 0) {
                        //game.players[pl].playerCards[c].pic.setTint(0x999999);
                    }
                }
                game.trumpsLeft[pl] = 5 - game.took[pl];
            }
            currentPlayer = (highBidder + 1) % 4;
            
            var timer = game.time.delayedCall(300 + (topPack - 22) * 50, this.nextPlay, [], this);
        }
        
        this.nextPlay = (startingPointsToBeat = 0, startingPlayerToBeat = 0, whistToBoard = (highBid == 30)) => {   // this is a host only function
            console.log(currentPlayer + ' playing');
            timeBar[currentPlayer].setFillStyle(0x00bb00);
            //console.log('trying to beat p' + startingPlayerToBeat + ' play of ' + startingPointsToBeat);
            if (game.players[currentPlayer].isComputer) {
                if (game.multiplayer) {
                    game.socket.emit("yourPlay", currentPlayer, game.players[highBidder].bestSuit, (game.whist || ((highBid == 30) && (game.trickNum == 1))), startingPointsToBeat);
                }        
                var hands = [[], [], [], []];
                var imaginaryPackT = new Pack();
                var imaginaryPackN = new Pack();
                var imaginaryPack = new Pack();
                var trumpSuit = game.players[highBidder].bestSuit;
                imaginaryPackT.createTrumps(trumpSuit);
                imaginaryPackN.createNonTrumps(trumpSuit);
                imaginaryPackT.shufflePack();
                imaginaryPackN.shufflePack();
                var fiveGone = false;

                // cycle through the players, start with self
                // currentPlayer already knows her own cards
                for (var j = 0; j < this.players[currentPlayer].playerCards.length; j++) { 
                    // load all your own cards into the array
                    hands[currentPlayer].push(this.players[currentPlayer].playerCards[j]);
                    if (this.players[currentPlayer].playerCards[j].isTrump(trumpSuit)) {
                        imaginaryPackT.removeCard(this.players[currentPlayer].playerCards[j]);
                        if (this.players[currentPlayer].playerCards[j].rank == '5') {
                            fiveGone = true;
                        }
                    } else {
                        imaginaryPackN.removeCard(this.players[currentPlayer].playerCards[j]);
                    }
                    //this.players[currentPlayer].playerCards[j].pic.setTint(0x77ccff);   // light up current
                }

                // now erase what we have already seen
                if (currentPlayer != highBidder) {
                    var p = highBidder;
                    for (var j = 0; j < game.playedCards.length; j++) {
                        if (game.playedCards[j].isTrump(trumpSuit)) {
                            //console.log('removing a trump we saw before');
                            if (game.playedCards[j].rank == '5') {
                                fiveGone = true;
                            }
                            imaginaryPackT.removeCard(game.playedCards[j]);  
                            //console.log('just removed from imaginaryPackT:');
                            //game.cardArrayPrint(imaginaryPackT.cards);
                        }
                    }
                    if (!fiveGone) {    
                        // someone still has the 5 so assume it's the bidder
                        //console.log('looking for the 5 in imaginaryPackT:');
                        //game.cardArrayPrint(imaginaryPackT.cards);
                        var theFive = imaginaryPackT.cards.find(element => element.rank == '5');
                        //console.log('theFive: ' + theFive);
                        hands[p].push(theFive);
                        imaginaryPackT.removeCard(theFive);
                        game.trumpsLeft[p]--;
                        fiveGone = true;
                        //console.log(p + ': removed the 5, so imaginaryPackT is now ' + imaginaryPackT);      
                    }                       
                }
                // so let's guess what the other cards might be
                for (var p = 0; p < 4; p++) {       
                    if (p != currentPlayer) {
                        for (var a = 0; a < game.trumpsLeft[p]; a++) {  // game.trumpsLeft
                            // once for each trump they appear to have                 
                            hands[p].push(imaginaryPackT.cards.pop());        
                            //console.log(p + ': removed unknown one, imaginaryPackT is now ' + imaginaryPackT);
                        }
                    }
                }


                imaginaryPackT.mergeWith(imaginaryPackN);
                imaginaryPackT.shufflePack();
                for (var i = 1; i < 4; i++) {
                    // fill the unknown hands with randoms
                    p = (currentPlayer + i) % 4;
                    while (hands[p].length < game.players[p].playerCards.length) {   
                        hands[p].push(imaginaryPackT.cards.pop());
                    }
                }

                this.nodes_map = new Map();
                var hcopy = [];
                for (var x = 0; x < 4; x++) {
                    var tmp = [...hands[x]];
                    hcopy.push(tmp);
                }

                /* temporary test- omniscient computer
                for (i = 0; i < 4; i++) {
                    hcopy[i] = [];
                    for (j = 0; j < this.players[i].playerCards.length; j++) {
                        hcopy[i].push(new Card(this.players[i].playerCards[j].suit, this.players[i].playerCards[j].rank, this.players[i].playerCards[j].value));
                    }
                }*/

                var bm = this.getBestMove(hcopy, currentPlayer, 0, startingPlayerToBeat, startingPointsToBeat, whistToBoard, () => {}, game.playsIn, 0, game.leadSuit);
                console.log(bm + ' is the best play');
                if (bm.length > 1) {
                    var bmArray = bm.split(',');
                    // it's a tie so pick one
                    var bestWithTie = -1;
                    var toBeat = 200;
                    for (i = 0;i < bmArray.length; i++) {

                        // look through all the cards from the AI and pick the lowest
                        if (hcopy[currentPlayer][bmArray[i]].getPointsValue(trumpSuit) < toBeat) {
                            toBeat = hcopy[currentPlayer][bmArray[i]].getPointsValue(trumpSuit);
                            bestWithTie = bmArray[i];
                        }
                    }
                } else {
                    bestWithTie = parseInt(bm);
                }

                if (this.players[currentPlayer].playerCards[bestWithTie].isTrump(trumpSuit)) {
                    var aiCard = bestWithTie;    
                } else {
                    // the AI card is a non-trump so just grab the lowest one if u can't beat it
                    toBeat = 200;
                    for (i = 0; i < this.players[currentPlayer].playerCards.length; i++) {

                        if ((this.players[currentPlayer].playerCards[i].getPointsValue(trumpSuit) > startingPointsToBeat) && (!this.players[currentPlayer].playerCards[i].isTrump(trumpSuit))) {
                            // if you can beat the non-trumps, then beat them
                            lowestCard = i;
                            break;
                        }
                        // just grab the lowest
                        if (this.players[currentPlayer].playerCards[i].getPointsValue(trumpSuit) < toBeat) {
                            toBeat = this.players[currentPlayer].playerCards[i].getPointsValue(trumpSuit);
                            var lowestCard = i;
                        }
                    }
                    var aiCard = lowestCard;
                }
                console.log('sending player ' + currentPlayer + ' card ' + aiCard);
                if (game.multiplayer) {
                    game.socket.emit("cardPlayed", currentPlayer, aiCard);               
                }
                
            } else { 
                if (currentPlayer == 0) {    // if it's the host
                    if (game.multiplayer) {
                        game.socket.emit("yourPlay", currentPlayer, game.players[highBidder].bestSuit, game.whist, startingPointsToBeat);
                    }
                    //this.players[0].makePlayable(game, game.players[highBidder].bestSuit, game.whist, startingPointsToBeat);    
                } else {
                    // send nudge to others to ask the guest player to play
                    console.log('sending yourPlay to ' + currentPlayer);
                    if (game.multiplayer) {
                        game.socket.emit("yourPlay", currentPlayer, game.players[highBidder].bestSuit, game.whist, startingPointsToBeat);
                    }
                }          
            }
        }
        
        this.showReceivedPlay = (seat, cardIndex) => {
            let localSeat = (seat - game.mySeat + 4) % 4;
            timeBar[currentPlayer].setFillStyle(0xffffff);
            //game.players[localSeat].playerCards[cardIndex].pic.setDepth(game.playsIn);
            game.players[localSeat].slideItIn(game, cardIndex);    
        }
        
        this.registerPlay = (cardTween, cardPic, player, playedCardIndex, playedCard) => {
            console.log('REGISTERING local player ' + player);
            game.playedCards.unshift(playedCard);  // add to the start of array of played cards
            game.players[player].playerCards.splice(playedCardIndex, 1); // and remove from player
            game.playsIn++;
            if ((game.multiplayer) && (!game.hosting)) {    // rest is a host-only function
                if ((game.sweepDirection >= 0) && (game.playsIn == 4)) {
                    game.playsIn = 0;
                    game.sweepTrick(game.sweepDirection);
                }
                return;
            }
    
            var trumpSuit = game.players[highBidder].bestSuit;
            var playValue = playedCard.getPointsValue(trumpSuit);

            if (game.playsIn == 1) {
                // first card just came in
                //console.log('first card in');
                if (playValue > 100) {
                    game.whist = true;
                    game.trumpsLeft[currentPlayer]--;
                } else {
                    //console.log('board not trumped, tracking lead suit');
                    game.whist = false;
                    playValue += 50; // first non-trump gets 50 bonus
                    game.leadSuit = playedCard.suit;
                }
                game.playerToBeat = currentPlayer;  // first card, so it must be best
                game.pointsToBeat = playValue;
                //playedCard.pic.setTint(0x99ff99);  // show the leading card?
            } else {
                if (playedCard.suit == game.leadSuit) {
                    playValue += 50;
                }
                if (playValue > game.pointsToBeat) {
                    //console.log('best card so far');
                    game.playerToBeat = currentPlayer;
                    //playedCard.pic.setTint(0x99ff99);
                    game.pointsToBeat = playValue;
                }
                if (playValue > 100) {
                    game.trumpsLeft[currentPlayer]--;
                }
            }
            
            if (game.playsIn == 4) {
                // trick is over, time to tally
                
                console.log('player ' + game.playerToBeat + ' won the trick!');   
                game.socket.emit('trickOver', game.playerToBeat);
                return;             
            } else {
                
                currentPlayer = (currentPlayer + 1) % 4;
                //console.log('pointsToBeat: ' + game.pointsToBeat + ' playerToBeat: ' + game.playerToBeat);
                game.time.delayedCall(225, this.nextPlay, [game.pointsToBeat, game.playerToBeat, game.whist], game);  // advance the player after a short delay
            }
        }
        
        this.registerTrick = () => {
            game.playsIn = 0;  
            game.trickNum++;

            if (game.pointsToBeat > game.bestTrumpValue) {
                game.bestTrumpValue = game.pointsToBeat; 
                game.bestTrumpPlayer = game.playerToBeat;
            } 
            tricksWon[game.playerToBeat % 2]++; // tally the trick
            //this.trickTally[game.playerToBeat % 2].setText(this.trickTally[game.playerToBeat % 2].text + '★');

            currentPlayer = game.playerToBeat;  // lead with winner
            // reset all the counters
            game.whist = false;
            game.leadSuit = -1;
            game.pointsToBeat = 0;
            if (game.trickNum < 6) {
                // tell the guests and carry on to the next play    
                game.time.delayedCall(1050, this.nextPlay, [0, -1, false], game);
            } else {
                //console.log('trick over - redealing');
                tricksWon[game.bestTrumpPlayer % 2]++; // score an extra for best card
                if ((tricksWon[highBidder % 2] * 5) >= highBid) {
                    // bidder made the contract
                    score[highBidder % 2] += (tricksWon[highBidder % 2] * 5);
                    if (highBid == 30) {
                        score[highBidder % 2] += 30;    // 30 is worth 60
                    }

                    score[(highBidder + 1) % 2] += (tricksWon[(highBidder + 1) % 2] * 5);
                    if ((score[highBidder % 2]) >= 120) {
                        (score[highBidder % 2]) = 120;  //game over!
                        game.tweens.add({
                            targets: game.scoreDisplay[score[highBidder % 2]],
                            alpha: 0,
                            yoyo: true,
                            loop: 10,
                            ease: 'Power1',
                            duration: 400,
                            onStart: game.players[0].lightUp,
                            onStartParams: [0, game]
                        });                        
                        return;
                    }                    

                } else {
                    // bidder went down
                    score[highBidder % 2] -= highBid;
                    if ((score[highBidder % 2]) <= -120) {
                        (score[highBidder % 2]) = -120;  //game over!
                    }                    
                    score[(highBidder + 1) % 2] += (tricksWon[(highBidder + 1) % 2] * 5);
                }
                if ((score[(highBidder + 1) % 2]) > 115) {
                    score[(highBidder + 1) % 2] = 115;  // can't limp out
                }                
                // update the scoreboard with the new scores
                this.scoreDisplay[highBidder % 2].setText(score[highBidder % 2]);
                this.scoreDisplay[(highBidder + 1) % 2].setText(score[(highBidder + 1) % 2]);
                this.handOver();         
            }
        }
        
        this.reactToTrickOver = (winner) => {   
            game.sweepDirection = winner;
            console.log('heard the trick is over on host. i have ' + game.playsIn + ' plays in');
            if (game.playsIn == 4) {
                this.sweepTrick(winner);
            }
        }
        
        this.sweepTrick = (winner) => {
            this.trickTally[(winner + game.mySeat) % 2].setText(this.trickTally[(winner + game.mySeat) % 2].text + '★');
            game.playsIn = 0;
            game.sweepDirection = -1;
            let myTargets = [];
            for (let i = 0; ((i < game.playedCards.length) && (i < 4)); i++) {
                myTargets.push(game.playedCards[i].pic);
            }
            console.log('sweeping targets (' + myTargets.length + '): ' + game.cardArrayPrint(game.playedCards));
            game.cardArrayPrint(game.players[0].playerCards);
            game.cardArrayPrint(game.players[1].playerCards);
            game.cardArrayPrint(game.players[2].playerCards);
            game.cardArrayPrint(game.players[3].playerCards);
            
            game.tweens.add({
                targets: myTargets,
                x: game.bubbleText[(winner - game.mySeat + 4) % 4].x,
                y: game.bubbleText[(winner - game.mySeat + 4) % 4].y + 70,  // line up with cards
                ease: 'Power1',
                duration: 300,  // how fast they sweep away
                delay: 700, // how long to wait in the middle
                onStart: game.players[(winner - game.mySeat + 4) % 4].lightUp,
                onStartParams: [(winner - game.mySeat + 4) % 4, game],
                onComplete: function () {
                    for (let i = 0; i < myTargets.length; i++) {
                        myTargets[i].setVisible(false);     // erase the swept cards
                    } 
                    for (let i = 0; i < 4; i++) {
                        if ((i == game.mySeat) || ((game.hosting) && (game.players[i].isComputer))) {
                            game.socket.emit('boardClear', game.mySeat);        
                        }
                    }
                    
                }
            }); 
            if (game.hosting) {
                game.registerTrick();
            } else {
                if (game.playedCards.length == 20) {
                    this.receivedHandOver();
                }
            }
        }            

        this.handOver = () => {
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
        
        this.receivedHandOver = () => {
            console.log('20 cards swept or misdeal, so clear all');     
            this.trickTally[0].setText();
            this.trickTally[1].setText();
            this.playedCards = [];
//            if (highBidder != -1) {
//                this.scoreDisplay[highBidder % 2].setText(bidderScore);
//                this.scoreDisplay[(highBidder + 1) % 2].setText(nonBidderScore); 
//            }
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
                        delay: 100,
                        duration: 500
                    });
                }
                game.players[a].playerCards = [];
            }
            game.bubbleText[0].setText('');
            game.bubbleText[1].setText('');
            game.bubbleText[2].setText('');
            game.bubbleText[3].setText(''); 
        }
        
        this.getBestMove = (board, iPlayer, pointsWon, cardToBeat, valueToBeat, boardTrumped, callback = () => {}, cardsIn = 0, depth = 0, ledSuit = -1) => {

             //clear nodes_map if the function is called for a new move
            if ((cardsIn == game.playsIn) && (depth == 0)) {
                /*console.log('first entry into getBestMove p' + iPlayer + ' pts:' + pointsWon + ' valueToBeat:' + valueToBeat);
                game.cardArrayPrint(board[0]);
                game.cardArrayPrint(board[1]);
                game.cardArrayPrint(board[2]);
                game.cardArrayPrint(board[3]);*/
                this.nodes_map.clear();    
            } 
            
             //If the board state is a terminal one, return the heuristic value
            if ((depth == max_depth) || (depth > (5 - game.trickNum))) { 
                return pointsWon; 
            }
            
            var trumpSuit = game.players[highBidder].bestSuit;
            if ((iPlayer % 2) != (highBidder % 2)) { // the opponents trying to minimize scoring
                
                //Initialize best to the highest possible value
                let best = 100;
                let processedNullCard = false;  // have we considered the rag card already?

                for (var i = 0; i < board[iPlayer].length; i++) {  
                    //game.thinking = true;
                    if ((cardsIn == game.playsIn) && (depth == 0)) {
                    //    game.players[iPlayer].playerCards[i].pic.setTint(0xccccff);
                        game.thinking = true;
                    }
                    let isT = board[iPlayer][i].isTrump(trumpSuit);
                    if ((isT ||  ((cardsIn > 0) && (board[iPlayer][i].suit == ledSuit)) || ((!processedNullCard) && ((!boardTrumped) || (game.trumpCount(board[iPlayer], trumpSuit) == 0))))) {  // ignore late non-trumps
                        if (!isT) { processedNullCard = true; }
                        let child = [[],[],[],[]];
                        child[0] = [...board[0]];
                        child[1] = [...board[1]];
                        child[2] = [...board[2]];
                        child[3] = [...board[3]];
                        //console.log(child);
                        let playedCard = new Card(child[iPlayer][i].suit, child[iPlayer][i].rank, child[iPlayer][i].value);
                        let playedCardValue = playedCard.getPointsValue(trumpSuit);
                        //if (this.trumpCount(child[iPlayer], trumpSuit) > 1) {
                            let isTheRightCard = (element) => ((element.rank == playedCard.rank) && (element.suit == playedCard.suit));
                            let pos = child[iPlayer].findIndex(isTheRightCard);
                            child[iPlayer].splice(pos, 1);
                        //}  
                        let thisCardPointsWon = pointsWon;
                        var nextCardsIn = cardsIn;
                        var nextDepth = depth;
                        var nextValueToBeat = valueToBeat;
                        var nextCardToBeat = cardToBeat;
                        var nextBoardTrumped = boardTrumped;
                        var nextLeadSuit = ledSuit;
                        if (cardsIn == 0) { // 1st card so set boardTrumped for recursive calls
                            if (playedCardValue > 100) {
                                nextBoardTrumped = true;
                            } else {
                                nextBoardTrumped = false;
                                nextLeadSuit = playedCard.suit;
                                playedCardValue += 50; // first non-trump gets 50 bonus
                            }
                            nextValueToBeat = playedCardValue; // first card is the best card
                            nextCardToBeat = iPlayer;
                        } else {
                            if ((playedCard.suit == ledSuit) && (playedCard.suit != trumpSuit)) {
                                playedCardValue += 50;
                            }
                            if (playedCardValue > valueToBeat) {
                                nextValueToBeat = playedCardValue;
                                nextCardToBeat = iPlayer;
                            }
                        }
                        if (cardsIn == 3) { // this is the final card in the trick
                            //console.log(depth + ' p' + iPlayer + ' min with ' + board[iPlayer][i].rank + ' val:' + playedCardValue + ' boardTrumped:' + nextBoardTrumped + ' valueToBeat:' + nextValueToBeat + ' pointsWon:' + thisCardPointsWon);
                        
                            var nextPlayer = nextCardToBeat; // the next player is the one who won the trick
                            nextCardsIn = 0;   // reset for next trick
                            nextDepth++;
                            //boardTrumped = false;
                            if ((nextCardToBeat % 2) == (highBidder % 2)) {
                                thisCardPointsWon = thisCardPointsWon + 5 - depth; // Declarer won the trick
                                //console.log('Declarer won a trick in this example - pointsWon now ' + thisCardPointsWon);
                            } 
                            nextValueToBeat = 0;
                        } else {
                            var nextPlayer = (iPlayer + 1) % 4; // advance to next player normally
                            nextCardsIn++;
                        }
                                
                        //Recursively calling getBestMove this time with the new board and maximizing turn and incrementing the depth                    
                        let node_value = this.getBestMove(child, nextPlayer, thisCardPointsWon, nextCardToBeat, nextValueToBeat, nextBoardTrumped, callback, nextCardsIn, nextDepth, nextLeadSuit);
                        //console.log('node_value: ' + node_value);
                        
                        //Updating best value
                        best = Math.min(best, node_value);

                        //If it's the main function call, not a recursive one, map each heuristic value with its moves indicies
                        if ((cardsIn == game.playsIn) && (depth == 0)) {
                            //Comma separated indicies if multiple moves have the same heuristic value
                            var moves = this.nodes_map.has(node_value) ? this.nodes_map.get(node_value) + ',' + i : i;  // this map will hold all the nodes and their values
                            this.nodes_map.set(node_value, moves);
                            console.log('setting ' + node_value + ' for ' + moves);
                        }
                    }
                }
                //If it's the main call, return the index of the best move or a random index if multiple indicies have the same value
                if ((cardsIn == game.playsIn) && (depth == 0)) {
                    let ret = this.nodes_map.get(best);

                    //run a callback after calculation and return the index
                    callback(ret);
                    return ret;
                } else {
                    //If not main call (recursive) return the heuristic value for next calculation
                    return best;                    
                }
                
            } else { // the declarers trying to maximizing scoring
                 
                //Initialize best to the lowest possible value
                let best = -100;
                let processedNullCard = false;

                for (var i = 0; i < board[iPlayer].length; i++) {
                    if ((cardsIn == game.playsIn) && (depth == 0)) {
                    //    game.players[iPlayer].playerCards[i].pic.setTint(0xccccff);
                        game.thinking = true;
                    }
                    let isT = board[iPlayer][i].isTrump(trumpSuit);                 
                    
                    if ((isT ||  ((cardsIn > 0) && (board[iPlayer][i].suit == ledSuit)) || ((!processedNullCard) && ((!boardTrumped) || (game.trumpCount(board[iPlayer], trumpSuit) == 0))))) {  // ignore late non-trumps
                        if (!isT) { processedNullCard = true; }
                        let child = [[],[],[],[]];
                        child[0] = [...board[0]];
                        child[1] = [...board[1]];
                        child[2] = [...board[2]];
                        child[3] = [...board[3]];
                        //console.log(child);
                        let playedCard = new Card(child[iPlayer][i].suit, child[iPlayer][i].rank, child[iPlayer][i].value);
                        let playedCardValue = playedCard.getPointsValue(trumpSuit);
                        //if (this.trumpCount(child[iPlayer], trumpSuit) > 1) {
                            let isTheRightCard = (element) => ((element.rank == playedCard.rank) && (element.suit == playedCard.suit));
                            let pos = child[iPlayer].findIndex(isTheRightCard);
                            child[iPlayer].splice(pos, 1);
                        //}                        
                        let thisCardPointsWon = pointsWon;
                        var nextCardsIn = cardsIn;
                        var nextDepth = depth;
                        var nextValueToBeat = valueToBeat;
                        var nextCardToBeat = cardToBeat;
                        var nextBoardTrumped = boardTrumped;
                        var nextLeadSuit = ledSuit;
                        if (cardsIn == 0) { // 1st card so set boardTrumped for recursive calls
                            if (playedCardValue > 100) {
                                nextBoardTrumped = true;
                            } else {
                                nextBoardTrumped = false;
                                nextLeadSuit = playedCard.suit;
                                playedCardValue += 50; // first non-trump gets 50 bonus
                            }
                            nextValueToBeat = playedCardValue; // first card is the best card
                            nextCardToBeat = iPlayer;
                        } else {
                            if ((playedCard.suit == ledSuit) && (playedCard.suit != trumpSuit)) {
                                playedCardValue += 50;
                            }
                            if (playedCardValue > valueToBeat) {
                                nextValueToBeat = playedCardValue;
                                nextCardToBeat = iPlayer;
                            }
                        }
                        if (cardsIn == 3) { // this is the final card in the trick
                            //console.log(depth + ' p' + iPlayer + ' min with ' + board[iPlayer][i].rank + ' val:' + playedCardValue + ' boardTrumped:' + nextBoardTrumped + ' valueToBeat:' + nextValueToBeat + ' pointsWon:' + thisCardPointsWon);
                        
                            var nextPlayer = nextCardToBeat; // the next player is the one who won the trick
                            nextCardsIn = 0;   // reset for next trick
                            nextDepth++;
                            nextBoardTrumped = false;
                            if ((nextCardToBeat % 2) == (highBidder % 2)) {
                                thisCardPointsWon = thisCardPointsWon + 5 - depth; // Declarer won the trick
                                //console.log('Declarer won a trick in this example - pointsWon now ' + thisCardPointsWon);
                            }
                            nextValueToBeat = 0;
                        } else {
                            var nextPlayer = (iPlayer + 1) % 4; // advance to next player normally
                            nextCardsIn++;
                        }
                        //console.log(depth + ' p' + iPlayer + ' max with ' + board[iPlayer][i].rank + ' val:' + playedCardValue + ' boardTrumped:' + nextBoardTrumped + ' valueToBeat:' + nextValueToBeat + ' pointsWon:' + thisCardPointsWon);                 
                                
                        //Recursively calling getBestMove this time with the new board and maximizing turn and incrementing the depth                    
                        let node_value = this.getBestMove(child, nextPlayer, thisCardPointsWon, nextCardToBeat, nextValueToBeat, nextBoardTrumped, callback, nextCardsIn, nextDepth, nextLeadSuit);
                        
                        //Updating best value
                        best = Math.max(best, node_value);

                        //If it's the main function call, not a recursive one, map each heuristic value with its moves indicies
                        if ((cardsIn == game.playsIn) && (depth == 0)) {
                            //Comma separated indicies if multiple moves have the same heuristic value
                            var moves = this.nodes_map.has(node_value) ? this.nodes_map.get(node_value) + ',' + i : i;  // this map will hold all the nodes and their values
                            this.nodes_map.set(node_value, moves);
                            console.log('setting ' + node_value + ' for ' + moves);
                        }
                    }
                }
                //If it's the main call, return the index of the best move or a random index if multiple indicies have the same value
                if ((cardsIn == game.playsIn) && (depth == 0)) {
                    let ret = this.nodes_map.get(best);

                    //run a callback after calculation and return the index
                    callback(ret);
                    return ret;
                } else {
                    //If not main call (recursive) return the heuristic value for next calculation
                    return best;                    
                }
            }

        }
            
                   
                
    }
    
    update() {
        /*if (this.thinking) {
            console.log('thinking');
            this.thinking = false;
            this.thought++;
            this.players[1].playerCards[this.thought].pic.setTint(0x88ccff);
            
            
        }*/
    }
}