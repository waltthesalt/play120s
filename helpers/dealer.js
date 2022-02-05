import Card from './card.js';

export default class Pack {    
    constructor() {
        this.cards = [];    
    }        

    createPack() {
        let ranks = ['Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'];
        let values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < ranks.length; j++) {
                this.cards.push(new Card(i, ranks[j], values[j]));
            }
        }
    }
    
    displayPack() {
        var fullArr = '';
        for (var i = 0; i < this.cards.length; i++) {
            if ((this.cards[i].suit) == 0) {
                var niceSymbol = '♣';
            } else if ((this.cards[i].suit) == 1) {
                var niceSymbol = '♥';
            } else if ((this.cards[i].suit) == 2) {
                var niceSymbol = '♠';
            } else {
                var niceSymbol = '♦';
            }
            fullArr = fullArr + this.cards[i].rank.substring(0,1) + niceSymbol + ' ';
        }
        //console.log(fullArr);
        return fullArr;
    }
    
    createTrumps(i) {
        let ranks = ['Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'];
        let values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
        for (let j = 0; j < ranks.length; j++) {
            this.cards.push(new Card(i, ranks[j], values[j]));
        }
        if (i != 1) {
            this.cards.push(new Card(1, 'Ace', 1)); // add the Ace of Hearts    
        }
        //console.log('created trump pack with ' + this.cards.length + ' cards');
    }
    
    createNonTrumps(i) {
        let ranks = ['Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'];
        let values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
        for (var n = 1; n < 4; n++) {
            for (let j = 0; j < ranks.length; j++) {
                if (!(((i + n) % 4 == 1) && (ranks[j] == 'Ace'))) {
                    this.cards.push(new Card((i + n) % 4, ranks[j], values[j]));
                }
            }
        }
    }
    
    shufflePack() {
       let location1, location2, tmp;
       for (let i = 0; i < 1000; i++) {
           location1 = Math.floor((Math.random() * this.cards.length));
           location2 = Math.floor((Math.random() * this.cards.length));
           tmp = this.cards[location1];
           this.cards[location1] = this.cards[location2];
           this.cards[location2] = tmp;
        }
    }
    
    removeCard(cardToRemove) {
        //console.log('trying to remove the '+ cardToRemove.rank + ' of ' + cardToRemove.suit);
        const isTheRightCard = (element) => ((element.rank == cardToRemove.rank) && (element.suit == cardToRemove.suit));
        var pos = this.cards.findIndex(isTheRightCard);
        if (pos > -1) {
            //console.log('found it');
            this.cards.splice(pos, 1);
            return true;
        } else {
            console.log('couldnt find the ' + cardToRemove.rank + ' of ' + cardToRemove.suit);
            console.log('searching in here:');
            this.displayPack();
            return false;
        }
    }
    
    mergeWith(newPack) {
        this.cards = this.cards.concat(newPack.cards);
    }


}
    
    
    
    
    
    
    
    
    