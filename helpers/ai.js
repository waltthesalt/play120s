import Pack from './dealer.js';
import Card from './card.js';
import Player from './player.js';
const max_depth = 12;  // AI looks max_depth moves ahead

export default class AI {
    constructor() {
        
    }
    
    aiPlay(seat, startingPlayerToBeat, startingPointsToBeat, whist, trumpSuit, leadPoints, players, playedCards, highBidder, highBid, trumpsLeft, leadSuit, playsIn, trickNum) {
        //console.log('trying to beat p' + startingPlayerToBeat + ' play of ' + startingPointsToBeat);
        
        var votes = [0,0,0,0,0];
        for (var sample = 0; sample < 10; sample++) {
            //console.log('Running perfect information sample '+sample);
            var hands = [];
            hands.push(new Player(0, true));
            hands.push(new Player(1, true));
            hands.push(new Player(2, true));
            hands.push(new Player(3, true));
            var imaginaryPackT = new Pack();
            var imaginaryPackN = new Pack();
            imaginaryPackT.createTrumps(trumpSuit);     // a pack containing only trumps
            imaginaryPackN.createNonTrumps(trumpSuit);  // a pack with the remaining non-trumps
            imaginaryPackT.shufflePack();
            imaginaryPackN.shufflePack();
            var fiveGone = false;
            var sampleTrumpsLeft = new Array(trumpsLeft[0], trumpsLeft[1], trumpsLeft[2], trumpsLeft[3]);     // so we pass by value
            //console.log('1:trumpsLeft ' + trumpsLeft + ' sampleTrumpsLeft '+sampleTrumpsLeft);
            // cycle through the players, start with self
            // currentPlayer already knows her own cards
            //console.log('my own hand length is '+players[seat].unplayedLength());
            for (var j = 0; j < 5; j++) { 
                // load all your own cards into the array
                if (!players[seat].playerCards[j].isPlayed()) {
                    hands[seat].playerCards.push(players[seat].playerCards[j]);
                    if (players[seat].playerCards[j].isTrump(trumpSuit)) {
                        imaginaryPackT.removeCard(players[seat].playerCards[j]);
                        if (players[seat].playerCards[j].rank == '5') {
                            fiveGone = true;    // I have the 5, so don't imagine it is anywhere else
                        }
                    } else {
                        imaginaryPackN.removeCard(players[seat].playerCards[j]);
                    }
                }
            }
         
            // now erase what we have already seen played (Bruce Parsons)
            if (seat != highBidder) {
                var p = highBidder;
                for (var j = 0; j < playedCards.length; j++) {
                    if (playedCards[j].isTrump(trumpSuit)) {
                        //console.log('removing ' + playedCards[j].displayCard() + ', a trump we saw before');
                        if (playedCards[j].rank == '5') {
                            fiveGone = true;
                        }
                        imaginaryPackT.removeCard(playedCards[j]);  
                    }
                }
                if (!fiveGone) {    
                    // someone still has the 5 so assume it's the bidder
                    var theFive = imaginaryPackT.cards.find(element => element.rank == '5');
                    hands[p].playerCards.push(theFive);
                    imaginaryPackT.removeCard(theFive);
                    sampleTrumpsLeft[p]--;
                    fiveGone = true;
                    //console.log(p + ': removed the ' + theFive.displayCard() + ' so imaginaryPackT is now ' + imaginaryPackT.displayPack());      
                }                       
            }
            //console.log('2:trumpsLeft ' + trumpsLeft + ' sampleTrumpsLeft '+sampleTrumpsLeft);
            
            // so let's guess what the other cards might be
            for (var p = 0; p < 4; p++) {       
                if (p != seat) {
                    for (var a = 0; a < sampleTrumpsLeft[p]; a++) {  // game.trumpsLeft
                        // once for each trump they appear to have                 
                        hands[p].playerCards.push(imaginaryPackT.cards.pop());        
                        //console.log(p + ': guessed a trump to remove, imaginaryPackT is now ' + imaginaryPackT.displayPack());
                    }
                }
            }
    
            imaginaryPackT.mergeWith(imaginaryPackN);
            imaginaryPackT.shufflePack();
            for (var i = 1; i < 4; i++) {
                // fill the unknown hands with random cards (trumps or non-trumps)
                p = (seat + i) % 4;
                //console.log('player '+p+' hand length is '+players[p].unplayedLength());
                while (hands[p].playerCards.length < players[p].unplayedLength()) {   
                    hands[p].playerCards.push(imaginaryPackT.cards.pop());
                }
            }
            console.log('Full imagined hands: '+hands[0].displayHand()+' '+hands[1].displayHand()+'  '+hands[2].displayHand()+'  '+hands[3].displayHand());
    /*
            // temporary test- omniscient computer
            for (i = 0; i < 4; i++) {
                hcopy[i] = [];
                for (j = 0; j < this.players[i].playerCards.length; j++) {
                    hcopy[i].push(new Card(this.players[i].playerCards[j].suit, this.players[i].playerCards[j].rank, this.players[i].playerCards[j].value));
                }
            }
            
    */
            if ((trickNum == 0) && (playsIn < 2)) {
                var depth = 12;
            } else {
                var depth = max_depth;
            }
            //console.log('player ' + seat + ' playsIn '+playsIn+' isMax '+(seat % 2 == highBidder % 2)+' highBidder '+highBidder+' highScore '+startingPointsToBeat);
            for (var i = 0;i < 1;i++) { // Run the minimax 5 times (we need a different set of imaginary hands for each though)
                var bestMove = this.minimax(hands, depth, -99999, 99999, (seat % 2 == highBidder % 2), trumpSuit, leadPoints, 0, seat, highBidder, highBid, trickNum, playsIn, startingPointsToBeat, startingPlayerToBeat, whist);
                //console.log('Sample ' + sample + ' recommending '+bestMove[0].displayCard() + ' to fetch score '+bestMove[1]);
                var selectedIndex = players[seat].findCard(bestMove[0]); // bestMove is a pair [best card,best score]
                votes[selectedIndex]++;
            }
        }
        console.log('Vote tally: '+votes);
        var winner = 0;
        var winVotes = votes[winner];
        for (i = 0;i < 5;i++) {
            if (votes[i] > winVotes) {  // look for the card with the most wins from the samples
                winVotes = votes[i];
                winner = i;
            }
        }
        return winner;
    }
    
    minimax(hands, depth, alpha, beta, isMaximizing, trumpSuit, leadPoints, sum, player, highBidder, highBid, trickNum, playsIn, highScore, highScorer, whistToBoard) {
        //console.log('minimax: hands '+hands[0].displayHand()+'  '+hands[1].displayHand()+'  '+hands[2].displayHand()+'  '+hands[3].displayHand()+'  depth '+depth+' isMax '+isMaximizing+' sum '+sum+' player '+player);
        var children = hands[player].legalPlays(whistToBoard, trumpSuit, leadPoints);   // my options are my cards
        var currMove;
        if (depth == 0 || children.length == 0) {
            return [null, sum];
        }
        var maxValue = -99999;
        var minValue = 99999;
        var bestMove;

        for (var i = 0; i < children.length; i++) {     // looping through the children moves
            currMove = children[i];                     // currMove is a card object

            var handsCopy = new Array(hands[0].copyPlayer(), hands[1].copyPlayer(), hands[2].copyPlayer(), hands[3].copyPlayer());     // so we pass by value
            var newScore = this.makeMove(handsCopy, currMove, depth, player, trumpSuit);     // this will update handsCopy to the new state
            if ((newScore < 100) && (playsIn == 0)) {   // add 50 to led non-trumps
                newScore = newScore + 50;
            }
            var nextPlayer = (player + 1) % 4;  // unless we reach the end of trick++;
    
            if (newScore > highScore) {
                var newHighScore = newScore;
                var newHighScorer = player;
            } else {
                var newHighScore = highScore;
                var newHighScorer = highScorer;
            }
            var newSum = sum + this.evaluateBoard(handsCopy, trumpSuit, player, highBidder);
            var nextTrickNum = trickNum;
            if (playsIn == 0) {
                var nextWhistToBoard = (children[i].isTrump(trumpSuit) || ((highBid == 30) && (trickNum == 0)));
                var nextLeadPoints = children[i].getPointsValue(trumpSuit);
            } else {
                var nextWhistToBoard = whistToBoard;
                nextLeadPoints = leadPoints;
                if (playsIn == 3) {
                    newSum = newSum + (((newHighScorer % 2) == (highBidder % 2)) ? 10000 : 0);
                    newHighScore = 0;
                    nextPlayer = newHighScorer;
                    var nextTrickNum = trickNum + 1;
                }
            }

            //console.log('evaluateBoard: '+newSum+' playsIn '+playsIn+' nextPlayer '+nextPlayer);
            var [childBestMove, childValue] = this.minimax(handsCopy, depth - 1, alpha, beta, (nextPlayer % 2 == highBidder % 2), trumpSuit, nextLeadPoints, newSum, nextPlayer, highBidder, highBid, nextTrickNum, (playsIn + 1) % 4, newHighScore, newHighScorer, nextWhistToBoard);
            
            if (isMaximizing) {
                if (childValue > maxValue) {
                    maxValue = childValue;
                    bestMove = children[i];   // currMove
                }
                if (childValue > alpha) {
                    alpha = childValue;
                }
            } else {
                if (childValue < minValue) {
                    minValue = childValue;
                    bestMove = children[i];   // currMove
                }
                if (childValue < beta) {
                    beta = childValue;
                }
            }  
            if (alpha >= beta) {
                break;
            }
            if (depth == max_depth) {
                //console.log('depth: trying play '+children[i].displayCard() + ' playsIn ' + playsIn + ' result ' + childValue);
            }
        }
    
        if (isMaximizing) {
            return [bestMove, maxValue];
        } else {
            return [bestMove, minValue];
        }
    }
    
    makeMove(hands, move, depth, player, trump) {
        var moveScore = move.getPointsValue(trump);
        hands[player].removeCard(move); 
        return moveScore;
    }
    
    evaluateBoard(hands, trumpSuit, player, highBidder) {
        //console.log('highBidder hands '+hands[highBidder].displayHand()+' '+hands[(highBidder+2)%4].displayHand()+' val '+(parseInt(hands[highBidder].getHandValue(trumpSuit)) + parseInt(hands[(highBidder + 2) % 4].getHandValue(trumpSuit))));
        //console.log('challenger hands '+hands[(highBidder+1)%4].displayHand()+' '+hands[(highBidder+3)%4].displayHand()+' val '+(parseInt(hands[(highBidder+1)%4].getHandValue(trumpSuit)) + parseInt(hands[(highBidder + 3) % 4].getHandValue(trumpSuit))));
        return (parseInt(hands[highBidder].getHandValue(trumpSuit)) + parseInt(hands[(highBidder + 2) % 4].getHandValue(trumpSuit)) - parseInt(hands[(highBidder + 1) % 4].getHandValue(trumpSuit)) - parseInt(hands[(highBidder + 3) % 4].getHandValue(trumpSuit))); // +sum?
    }
   
    aiBid(player, leadingBid, isDealer, returnSuit = false) {
        var bestBid = 0;
        var bid;
        
        for (var suitItem = 0;suitItem < 4;suitItem++) {
            bid = 0;
            player.playerCards.forEach (function (cardItem) {
                if ((cardItem.suit == suitItem) || ((cardItem.suit == 1) && (cardItem.rank == 'Ace'))) {
                    if (cardItem.rank == '5') {
                        bid += 19;
                    } else if (cardItem.rank == 'Jack') {
                        bid += 8;
                    } else if ((cardItem.rank == 'Ace') || (cardItem.rank == 'King')) {
                        bid += 4;
                    } else if (cardItem.rank == 'Queen') {
                        bid += 2;
                    } else {
                        bid += 1;
                    }
                }
                bid += Math.floor(Math.random() * 3);   // add some randomness to the bid
                if (bid > 30) {
                    bid = 30;
                }
                // add up the bid values
            
            });
            if (bid > bestBid) {
                bestBid = bid;
                this.bestSuit = suitItem;
            }
        }
        bestBid = Math.floor(bestBid / 5) * 5;                                                                          // make it a multiple of 5
        if ((bestBid < 20) || ((!isDealer) && (bestBid <= leadingBid)) || (isDealer && (bestBid < leadingBid))) {       // no 15 bids and have to reach the minimum bid
            bestBid = 0;
        } else {
            if ((isDealer) && (bestBid != 30)) {
                    bestBid = leadingBid;   // No need to overbid the dealer, unless it's 30
            }
        }
        
        if (returnSuit) {
            return this.bestSuit;
        } else {
            //console.log('player '+player+' is choosing '+bestBid);
            return bestBid;
        }
    }
}