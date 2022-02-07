export default class Card {
    constructor(suit, rank, value) {
        this.suit = suit;
        this.rank = rank;
        this.value = value;
        this.scrapped = false;
        this.played = false;
    }
    
    render(x, y, sprite, n, scene, seat, clickable = false) {
        let card = scene.add.image(x, y, sprite, n);
        card.setDepth(x);
        this.pic = card;
        this.scrapped = false;
        let self = this;
        if (clickable) {
            card.setInteractive();
            this.pic.on('pointerup', function() {
                //console.log('clicked ' + this.isTinted + ' ' + 0x777777);
                if (self.isScrapped()) {
                    this.clearTint();
                    self.scrapped = false;
                } else {
                    this.setTint(0x777777);
                    self.scrapped = true;
                }
            });
        }
        return card;
    }
    
    flipUp() {
        let suitnames = ['clubs', 'hearts', 'spades', 'diamonds'];
        this.pic.setTexture('cards', suitnames[this.suit]+''+this.rank);
        this.pic.setInteractive();
        let self = this;
        this.pic.on('pointerup', function() {
            //console.log('clicked ' + this.isTinted + ' ' + 0x777777);
            if (self.isScrapped()) {
                this.clearTint();
                self.scrapped = false;
            } else {
                this.setTint(0x777777);
                self.scrapped = true;
            }
        });
    }
    
    scrap() {
        this.scrapped = true;
        this.pic.setTint(0x777777);
    }
    
    discard() {
        this.scrapped = true;
    }
    
    recover() {
        this.scrapped = false;
        this.pic.clearTint();        
    }
    
    isScrapped() {
        return this.scrapped;
    }
    
    isPlayed() {
        return this.played;
    }
    
    setPlayed() {
        this.played = true;
    }
    
    isTrump(t) {
        if ((this.suit == t) || ((this.suit == 1) && (this.rank == 'Ace'))) {
            return true;
        } else {
            return false;
        }
    }
    
    getPointsValue(trumps) {
        var val = 0;
        if (this.suit == trumps) {
            switch (this.rank) {
                case '5':
                    val = 14;
                    break;
                case 'Jack':
                    val = 13;
                    break;
                case 'Ace':
                    val = 11;
                    break;
                case 'King':
                    val = 10;
                    break;
                case 'Queen':
                    val = 9;
                    break;
                case '10':
                case '9':
                case '8':
                case '7':
                case '6':
                    if ((this.suit == 0) || (this.suit == 2)) { // black suits
                        val = 11 - this.value;
                    } else {
                        val = this.value - 2;
                    }
                    break;
                case '4':                   
                case '3':
                case '2':
                    if ((this.suit == 0) || (this.suit == 2)) { // black suits
                        val = 10 - this.value;
                    } else {
                        val = this.value - 1;
                    }
                    break;
            }
            val += 100;
        } else {
            // non-trumps
            if ((this.suit == 0) || (this.suit == 2)) { // black suits
                if (this.value < 11) {
                    val = 11 - this.value;
                } else {
                    val = this.value;
                }
            } else {
                val = this.value;   // red suits are straight up normal
            }
        }
        if ((this.suit == 1) && (this.rank == 'Ace')) {
            val = 112;
        }
        //console.log('this.value: ' + this.value);
        return val;
    }
    
    displayCard() {
        if ((this.suit) == 0) {
            var niceSymbol = '♣';
        } else if ((this.suit) == 1) {
            var niceSymbol = '♥';
        } else if ((this.suit) == 2) {
            var niceSymbol = '♠';
        } else {
            var niceSymbol = '♦';
        }
        return (this.rank.substring(0,1) + niceSymbol);
    }
    
 
}

