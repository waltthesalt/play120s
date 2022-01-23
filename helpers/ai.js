    //console.log(currentPlayer + ' playing');
    //console.log('trying to beat p' + startingPlayerToBeat + ' play of ' + startingPointsToBeat);
    if (false) {    // This is the AI (not used right now)
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