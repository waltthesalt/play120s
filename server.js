//import Phaser from 'http://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.js';

import Pack from './helpers/dealer.js';
import Player from './helpers/player.js';

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer);
const DEALING = 0;
const BIDDING = 1;
const SELECTING = 2;
const DISCARDING = 3;
const PLAYING = 4;

let playerSockets = [];
let playerSeats = [];
var playerCount = 0;
let names = ['','','',''];
const p = new Pack();
p.createPack();       // calling our function to fill our array
p.shufflePack();
let bubbleText = [];     
let game = this;
var misdeal = false;
let players = [];
players.push(new Player(0, false));
players.push(new Player(1, false));
players.push(new Player(2, false));
players.push(new Player(3, false));
players.push(new Player(4, false));

var dealer = -1;
var gameClock = 100;
var gameInterval;
var currentPlayer = -1;
var playerToBeat = -1;
var pointsToBeat = 0;
var bestTrumpValue = 0; // Keep track of the highest trump for that extra 5 points
var bestTrumpPlayer = -1;
app.get('/*', (req, res, next) => {
  res.sendFile('/home/ec2-user/environment' + req.url);
});

// Initialize global variables
var gameState = DEALING;
var roomno = 1;
var boardCount = [];
var playedCards = [];
var bubbles = [];
var highBid = 0;
var highBidder = -1;
var trumpSuit = -1; 
var leadSuit = -1;
var bidsIn = 0;
var playsIn = 0;
var trickNum = 0;
var discardsIn = [];
var trumpsLeft = [0,0,0,0];
var took = [0,0,0,0];
var tricksWon = [0,0];
var score = [0,0];  // We and They scores
var whist = false;

boardCount[roomno] = 0;

io.on('connection', function (socket) {
    console.log('A user connected: ' + socket.id);
    
    //Increase roomno if 4 clients are present in a room.
    /*if(io.nsps['/'].adapter.rooms["room-"+roomno] && io.nsps['/'].adapter.rooms["room-"+roomno].length > 3)     roomno++;*/
    socket.join("room-"+roomno);
    console.log('A new player connected to room no. ' + roomno + '. playerCount=' + playerCount);

    if (playerSockets.length == 0) {
        console.log('First player to connect!');
        dealer = Math.floor(Math.random() * 3);
        currentPlayer = (dealer + 1) % 4;
        console.log('dealer:'+dealer+'  currentPlayer:'+currentPlayer);
        playedCards = [];
        bubbles = [];
        highBid = 0;
        highBidder = -1;
        bidsIn = 0;
        playsIn = 0;
        discardsIn = [];
        whist = false;
    } else {
        //console.log('Telling everyone whats after happening.');
        // Tell this player what is already in place
        for (var i=0; i<playerSockets.length; i++) {
            console.log('Found the player ' + playerSeats[i] + ' to send out.');
            io.sockets.in("room-"+roomno).emit('reservedSeat', playerSeats[i]);
        }     
        for (i=0; i<4; i++) {
            if (names[i]!='') {
                //console.log('Found the name ' + names[i] + ' to send out.');
                io.sockets.in("room-"+roomno).emit('setName', i, names[i]);
            }
            
        }
    }

    playerSockets.push(socket.id);
  
    socket.on('takeSeat', function(seat) {
        console.log(socket.id + ' reserved seat ' + seat); 
        if (playerSeats.length == 0) {
            console.log('First player to take a seat.');
            names = ['','','',''];
            playedCards = [];
            playerSeats = [];
            bubbles = [];
        }
        
        playerSeats.push(seat);
        io.sockets.in("room-"+roomno).emit('reservedSeat', seat, dealer); 
        if (playerSeats.length == 4) {
            console.log('We have a full table. Lets start the game.');
            shuffleAndDeal();
        }
    });
    
    socket.on('setName', function(seat, name) {
        names[seat] = name;
        for (let i = 0; i < names.length; i++) {
            if (names[i] != '') {
                io.sockets.in("room-"+roomno).emit('setName', i, names[i]);    
            }
        }     
    });

    socket.on('playerBid', function (seat, bid) {
        console.log('received ' + bid + ' from seat ' + seat);
        processBid(seat, bid);
    });
    
    socket.on('selectedSuit', function (seat, bestSuit) {
        trumpSuit = bestSuit;
        discardsIn = [];
        gameState = DISCARDING;
        gameClock = 100;    // Reset the clock
        io.sockets.in("room-"+roomno).emit('receivedSuitfromServer', highBidder, highBid, trumpSuit);   // Start the discarding
        console.log('starting timer on suits');
        pitterPatter(true);
    });
    
    socket.on('tookCardsFromKit', function (kitCards) {
        let i = 0;
        let discards = [];
        console.log('The highBidder just announced taking '+kitCards+' from the kit.');
        console.log('highBidder has ' + discards.length + ' discards at the start of the function');
        for (let c = 0; c < 5; c++) {
            if ((players[highBidder].playerCards[c].isScrapped()) && (kitCards.length > 0)) {
                let kc = kitCards.shift();
                console.log('card '+c+' is scrapped and replaced with kitCard '+ kc);
                players[highBidder].playerCards[c] = players[4].playerCards[kc];   // Copy in the kit card
                players[highBidder].playerCards[c].scrapped = false;
                io.sockets.in("room-"+roomno).emit('replaceCard', highBidder, c, players[highBidder].playerCards[c].rank, players[highBidder].playerCards[c].suit, players[highBidder].playerCards[c].value); // Tell the others about the kit card coming in
            } else if ((players[highBidder].playerCards[c].isScrapped()) && (kitCards.length == 0)) {
                console.log('card '+c+' is scrapped card(k)');
                discards.push(c);
            }
        }
        
        console.log('highBidder has ' + discards.length + ' discards after picking up kit');
        io.sockets.in("room-"+roomno).emit('announceDiscards', highBidder, discards);
        discardsIn.push(highBidder);   // need all four players to finish
        //console.log(dCount + ' players are ready to move on');
        if (discardsIn.length == 5) {  // received discards from all players, so time to move ahead in the game.
            fillHands(); 
        }
    });
    
    socket.on('announceDiscards', function (seat, discards) {
        //console.log('received discards from ' + seat);
        console.log('Player '+seat+' just announced '+discards.length+ ' discards.');
        if (seat != highBidder) {   // Wait for kit substitution before sending out highBidder discards
            io.sockets.in("room-"+roomno).emit('announceDiscards', seat, discards);
        }
        console.log('discards:'+discards);
        for (let i = 0; i < discards.length; i++) {
            console.log('discarding card '+discards[i]);
            players[seat].playerCards[discards[i]].discard(); // Server notes that these cards are discarded.
        }

        discardsIn.push(seat);   // need all four players plus kit to finish
        console.log(discardsIn.length + ' hands are ready to move on');
        if (discardsIn.length == 5) {  // received discards from all players, so time to move ahead in the game.
            fillHands(); 
        }
    });   
    
    socket.on('cardPlayed', function (seat, cardIndex) {
        gameClock = 100;
        io.sockets.in("room-"+roomno).emit('cardPlayed', seat, cardIndex);  // Tell it to all the players
        //console.log('received the '+players[seat].playerCards[cardIndex].rank + ' of ' + players[seat].playerCards[cardIndex].suit + ' from server (trumps is '+trumpSuit+ ').');
        players[seat].playerCards[cardIndex].setPlayed();     // Use this method to tell if already played.
        var playValue = players[seat].playerCards[cardIndex].getPointsValue(trumpSuit);
        
        playsIn++;
        if (playsIn == 1) {
            // first card just came in
            //console.log('first card in');
            if (playValue > 100) {
                //console.log('trump to the board');
                whist = true;
                trumpsLeft[currentPlayer]--;    // Training the AI
            } else {
                //console.log('board not trumped, tracking lead suit');
                whist = false;
                playValue += 50; // first non-trump gets 50 bonus
                leadSuit = players[seat].playerCards[cardIndex].suit;
            }
            playerToBeat = currentPlayer;  // first card, so it must be best
            pointsToBeat = playValue;
        } else {
            if ((players[seat].playerCards[cardIndex].suit == leadSuit) && (leadSuit != trumpSuit)) {
                playValue += 50;
            }
            if (playValue > pointsToBeat) {
                //console.log('best card so far');
                playerToBeat = currentPlayer;
                //playedCard.pic.setTint(0x99ff99);
                pointsToBeat = playValue;
            }
            if (playValue > 100) {
                trumpsLeft[currentPlayer]--;    // This is inform the AI
            }
        }
        console.log('Player '+seat+' just played a value of '+playValue+' points.');
        if (playsIn == 4) {
            // trick is over, time to tally
            var handOver = false;
            console.log('trick is over. player ' + playerToBeat + ' won the trick!');   
            playsIn = 0;
            trickNum++;
            if (pointsToBeat > bestTrumpValue) {
                bestTrumpValue = pointsToBeat; 
                bestTrumpPlayer = playerToBeat;
            } 
            tricksWon[playerToBeat % 2]++; // tally the trick
            currentPlayer = playerToBeat;  // lead with winner
            // reset all the counters
            leadSuit = -1;
            pointsToBeat = 0;
            if (trickNum < 5) {
                //nextPlay();   The next play will start when all clients have cleared their board
            } else {
                console.log('Hand is over!');

                tricksWon[bestTrumpPlayer % 2]++; // score an extra for best card
                if ((tricksWon[highBidder % 2] * 5) >= highBid) {
                    // bidder made the contract
                    score[highBidder % 2] += (tricksWon[highBidder % 2] * 5);
                    if (highBid == 30) {
                        score[highBidder % 2] += 30;    // 30 is worth 60
                    }

                    score[(highBidder + 1) % 2] += (tricksWon[(highBidder + 1) % 2] * 5);
                    if ((score[highBidder % 2]) >= 120) {
                        (score[highBidder % 2]) = 120;  //game over!
                        console.log('Game is over!!!');
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
                handOver = true;
            }
            io.sockets.in("room-"+roomno).emit('trickOver', playerToBeat);  // Tell the clients to end the trick
            if (handOver) {     // Hand is over
                tallyUpHand();
            } else {            // Trick is over but hand is not
                var h = '';
                for (var x=0; x<4; x++) {
                    for (var y=0; y<5; y++) {
                        if (players[x].playerCards[y].isPlayed()) {
                            h = h + '-,';
                        } else {
                            h = h + players[x].playerCards[y].rank + ',';
                        }
                    }
                    h = h + ',,,';
                }
            }
            setTimeout(function() { nextPlay(); }, 500); // Give the clients a chance to clean up before going to next trick
            console.log('complete hands:'+h);            
        } else {
            currentPlayer = (currentPlayer + 1) % 4;    // Advance the player around the table
            nextPlay(pointsToBeat, playerToBeat, whist);
        }   
        
    });
    
    socket.on('boardClear', function (seat) {
        boardCount[roomno]++;   // Do we need this function, which waits on all the clients before proceeding??
        //console.log(boardCount[roomno] + ' players cleared the trick.');
        if ((boardCount[roomno] == 4) ) {    // When we have heard from all players but the hand is not yet over
            //console.log('all tricks cleared - move to next trick with currentPlayer=' + currentPlayer);
            boardCount[roomno] = 0;
            /*if ((playsIn == 0) && (trickNum == 0))
            nextPlay();*/
        }
    
    });    
    
    socket.on('disconnect', function () {
        var whoLeft = playerSockets.findIndex(player => player == socket.id);
        var seatWhoLeft = playerSeats[whoLeft];
        console.log('playerSockets contains '+playerSockets.length+ ' entries.');
        playerSockets.splice(whoLeft, 1);
        console.log('playerSockets contains '+playerSockets.length+ ' entries.');
        playerSeats.splice(whoLeft, 1);
        highBid = 0;
        highBidder = -1;
        console.log('A user disconnected: ' + socket.id + ' from seat ' + seatWhoLeft + ' leaving ' + playerSockets.length + ' connections.');
        if (playerSockets.length == 0) {
            clearTimeout(gameInterval);     // Don't leave any ghost timers on
        }
        io.sockets.in("room-"+roomno).emit('playerLeftTable', seatWhoLeft);

    });
});

httpServer.listen(8082, () => {
  console.log('listening on *:8082');
});

var shuffleAndDeal = () => {
    //console.log('distributing cards');
    p.shufflePack();
    players[0].playerCards = p.cards.slice(0, 5);  // replace with an addCards() method
    players[1].playerCards = p.cards.slice(5, 10);
    players[2].playerCards = p.cards.slice(10, 15);
    players[3].playerCards = p.cards.slice(15, 20);
    players[4].playerCards = p.cards.slice(20, 23); // kitty
    for (var cd = 0; cd < 5; cd++) {
        for (var pl = 0; pl < 5; pl++) {
            if (((dealer + 1 + pl) % 5 < 4) || (cd < 3)) { // don't put too many in kit
                players[(dealer + 1 + pl) % 5].playerCards[cd].played = false;  // reset this card as unplayed
                players[(dealer + 1 + pl) % 5].playerCards[cd].scrapped = false;       // reset this card as not discarded
                // send the card to the others
                io.sockets.in("room-"+roomno).emit("dealCards", (dealer + 1 + pl) % 5, players[(dealer + 1 + pl) % 5].playerCards[cd].rank, players[(dealer + 1 + pl) % 5].playerCards[cd].suit, players[(dealer + 1 + pl) % 5].playerCards[cd].value, true);
            }
        }
    }
    gameState = BIDDING;
    nextBid();    
    //io.sockets.in("room-"+roomno).emit('updateScore', 20, 10);    // Tell the clients to end the hand                   TEST
    //setTimeout(function() { shuffleAndDeal(); }, 5050); // Give the clients a chance to clean up before going to next hand          TEST
}

var nextBid = () => { 
    var thisBid = 0;
    // invite a guest to bid
    io.sockets.in("room-"+roomno).emit("requestBid", currentPlayer, highBid, dealer);   // ask guests to bid
    console.log('starting timer on bids');
    pitterPatter();
};

var processBid = (seat, bid) => {
    io.sockets.in("room-"+roomno).emit('receivedBidfromServer', seat, bid); // Tell everyone else
    console.log('Current highBid is ' + highBid + ' and highBidder is '+ highBidder);
    if (bid > highBid) {    // a new high bid
        if (seat != dealer) {
            highBid = bid;
            highBidder = seat;
        } else {
            gameState = SELECTING;    // dealer raised
            highBidder = dealer;
            highBid = bid;
        }
    }
    bidsIn++;
    console.log('Player ' + seat + ' bids ' + bid + '. High bidder = ' + highBidder);
    if (bidsIn < 4) {
        // early bidding, move around the table
        var nextBidder = (seat + 1) % 4;
    } else if ((highBid == 0) && (bid == 0)) {
        // misdeal
        console.log('misdeal?');
        gameState = DEALING;
        misdeal = true;
        io.sockets.in("room-"+roomno).emit('misdeal'); 
        tallyUpHand();   // same as when hand concludes the normal way
        return;
    } else if ((seat == highBidder) && (bid == 0)) {
        // highbidder backed down, we are done;
        gameState = SELECTING;
        console.log('We are done because the highbidder backed down.');
        highBidder = dealer;
    } else if ((seat == dealer) && (bid == 0)) {
        // dealer backed down, we are done;
        gameState = SELECTING;
        console.log('We are done because the dealer backed down.'); 
    } else if ((bidsIn % 2 == 0) && (bid == highBid)) {
        console.log(bidsIn + ' bids in, going to highbidder ' + highBidder);
        // highbidder was called, go back to the highbidder
        nextBidder = highBidder;
    } else if (bidsIn % 2 == 1) {
        console.log(bidsIn + ' bids in, going to dealer ' + dealer);
        nextBidder = dealer;
    }
    
    // Check if we are done
    if (gameState == BIDDING) {
        currentPlayer = nextBidder;
        nextBid();  // move along to the next
    } else {
        currentPlayer = highBidder;
        io.sockets.in("room-"+roomno).emit('requestSuit', highBidder, highBid, dealer);
        console.log('starting timer on suits');
        pitterPatter();
    }
}

var fillHands = () => {
    gameClock = 100;
    // Now draw cards from the pack
    var topPack = 23;   // next card to draw out
    for (var i = 0; i < 4; i++) {
        var pl = (dealer + 1 + i) % 4;
        for (var c = 0; c < 5; c++) {
            if (players[pl].playerCards[c].isScrapped()) {
                console.log('replacing player '+pl+'s card ' + c+' because it is scrapped');
                players[pl].playerCards[c] = p.cards[topPack]; // replace
                players[pl].playerCards[c].played = false;
                // send the card to the server to tell the others
                io.sockets.in("room-"+roomno).emit("dealCards", pl, players[pl].playerCards[c].rank, players[pl].playerCards[c].suit, players[pl].playerCards[c].value, true, c);    // this will trigger showReceivedCards
                took[pl]++; // Teach the AI what each player took from the pack
                topPack++;
            }
        }
        trumpsLeft[pl] = 5 - took[pl];  // Training the AI to keep track of trumps in opponent hands
    }
    var h = '';
    for (var x=0; x<4; x++) {
        for (var y=0; y<5; y++) {
            h = h + players[x].playerCards[y].rank + ',';
        }
        h = h + '    ';
    }
    console.log('complete hands:'+h);
    gameState = PLAYING;
    playerToBeat = -1;
    pointsToBeat = 0;
    currentPlayer = (highBidder + 1) % 4;
    
    nextPlay();
};

var nextPlay = (startingPointsToBeat = 0, startingPlayerToBeat = 0, whistToBoard = (highBid == 30)) => { 
    // Tell the current player to play a card
    io.sockets.in("room-"+roomno).emit("yourPlay", currentPlayer, trumpSuit, whistToBoard, startingPointsToBeat);
    // And start a timer
    console.log('starting timer on plays');
    pitterPatter();
};

var pitterPatter = () => {
    //io.sockets.in("room-"+roomno).emit("pitterPatter", currentPlayer, gameClock, gameState);
    clearInterval(gameInterval);
    gameInterval = setTimeout(timesUp, 30000);
};

var timesUp = () => {
    if (gameState == BIDDING) {
        processBid(currentPlayer, 0);               // Force the bidder to Pass
    } else if (gameState == SELECTING) {
        trumpSuit = Math.floor(Math.random() * 4);  // Force the highBidder to pick a random suit
        discardsIn = [];
        gameState = DISCARDING;
        io.sockets.in("room-"+roomno).emit('receivedSuitfromServer', highBidder, highBid, trumpSuit); 
    } else if (gameState == DISCARDING) {           // Force the players to discard highlighted cards
        for (var i=0; i<4; i++) {
            if (!discardsIn.includes(i)) {  // Only force the players who haven't already responded
                io.sockets.in("room-"+roomno).emit('forceDiscardButton', i);     
            }
        }
    } else if (gameState == PLAYING) {              // Force the player to play the first legal card
        console.log('Go to AI');
    }
};

var tallyUpHand = () => {
    misdeal = false;
    dealer = (dealer + 1) % 4;  // Advance the dealer, even after misdeal
    currentPlayer = (dealer + 1) % 4;
    console.log('tallyUpHand() dealer:'+dealer+'  currentPlayer:'+currentPlayer);
    playedCards = [];
    bubbles = [];
    boardCount[roomno] = 0;
    highBid = 0;
    highBidder = -1;
    bidsIn = 0;
    playsIn = 0;
    discardsIn = [];
    whist = false;  
    trickNum = 0;
    bestTrumpValue = 0;    
    bestTrumpPlayer = -1;
    tricksWon[0] = 0;
    tricksWon[1] = 0;
    
    console.log('updating scores ' + score[0] + ' vs '+ score[1]);
    io.sockets.in("room-"+roomno).emit('updateScore', score[0], score[1], dealer);    // Tell the clients to end the hand
    setTimeout(function() { shuffleAndDeal(); }, 4000); // Give the clients a chance to clean up before going to next hand
}