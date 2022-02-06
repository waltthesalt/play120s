export default class ButtonBar {
    constructor(game, x, y) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.r = [];    
        this.buttons = [];  // deal and bid buttons
        this.sym = [];  // suit buttons
        this.drawDealButton();
    }
    
    drawBidButtons() {    
        var buttonLabels = ['Pass', '20', '25', '30'];
        var xo = 0;
        var dmt = 0;
        var self = this;
        for (let i = 2; i < 6; i++) {
            this.buttons.push(this.game.add.bitmapText(this.x + xo, this.y, 'gothic2', buttonLabels[i - 2], 48));
            this.buttons[i].setTint(0x888888).setDepth(1).setAlpha(0);
            
            if (i == 2) {
                xo = xo + 42;
            } else {
                dmt = 20;
            }
            this.r.push(this.game.add.rectangle(this.buttons[i].x + 48 - dmt, this.buttons[i].y + 35, this.buttons[i].width + 30, this.buttons[i].height + 10, 0x555555).setAlpha(0));
            
            this.buttons[i].on('pointerover', function () {
                self.r[i].setFillStyle(0x000000);
            });      
            
            this.buttons[i].on('pointerout', function () {
                self.r[i].setFillStyle(0x555555);
            });            
            xo = xo + 100;
        }
        // now create the suit buttons
        this.buttons.push(this.game.add.image(485, this.buttons[0].y + 28, 'clubs').setInteractive().setData('suitCode',0).setAlpha(0));
        this.buttons.push(this.game.add.image(585, this.buttons[0].y + 28, 'hearts').setInteractive().setData('suitCode',1).setAlpha(0));
        this.buttons.push(this.game.add.image(685, this.buttons[0].y + 28, 'spades').setInteractive().setData('suitCode',2).setAlpha(0));
        this.buttons.push(this.game.add.image(785, this.buttons[0].y + 28, 'diamonds').setInteractive().setData('suitCode',3).setAlpha(0));        
        
        this.buttons.push(this.game.add.bitmapText(this.x + 125, this.y, 'gothic2', 'Discard', 48).setDepth(1).setVisible(false).setAlpha(0).setInteractive());
        let b = this.buttons.length - 1;
        this.r.push(this.game.add.rectangle(this.buttons[b].x + 83, this.buttons[b].y + 35, this.buttons[b].width + 30, this.buttons[b].height + 10, 0x555555).setVisible(false).setAlpha(0));
        let rlen = this.r.length - 1;
       
        this.buttons[b].on('pointerover', function() {  // the discard button
            self.r[rlen].setFillStyle(0x000000);
        });
        this.buttons[b].on('pointerout', function() {
            self.r[rlen].setFillStyle(0x555555);
        });
        this.buttons[b].on('pointerdown', function() {
            self.hideDiscardButton(b, rlen);
            self.game.lockInDiscards();
        });        
       
        this.buttons[2].on('pointerdown', function () {
            self.game.players[0].bid = 0;
            self.game.displayBid(self.userSeat, 0);
            self.game.registerBid(0);
            //self.hideBidButtons();    // now handled in displayBid
        })     
        this.buttons[3].on('pointerdown', function () {
            console.log('player '+self.userSeat+' bid 20');
            self.game.players[0].bid = 20;
            self.game.displayBid(self.userSeat, 20);
            self.game.registerBid(20);
            //self.hideBidButtons();
        })
        this.buttons[4].on('pointerdown', function () {
            self.game.players[0].bid = 25;
            self.game.displayBid(self.userSeat, 25);
            self.game.registerBid(25);
            //self.hideBidButtons();
        })
        this.buttons[5].on('pointerdown', function () {
            self.game.players[0].bid = 30;
            self.game.displayBid(self.userSeat, 30);
            self.game.registerBid(30);
            //self.hideBidButtons();
        })   
        for (var i = 6; i < 10; i++) {
            this.buttons[i].setInteractive();
            this.buttons[i].on('pointerover', function () {
                this.setTint(0xBBBBBB);
            });
            this.buttons[i].on('pointerout', function () {
                this.setTint();
            });
            this.buttons[i].on('pointerup', function () {
                console.log('pressed the suit button');
                this.setTint(0x999999);
                for (var j = 6;j < 10;j++) {
                    self.buttons[j].disableInteractive();
                }
                self.game.tweens.add({
                    targets: [self.buttons[6], self.buttons[7], self.buttons[8], self.buttons[9]],
                    alpha: 0,
                    ease: 'Power1',
                    duration: 200
                });
                self.game.showSuit(this.getData('suitCode'));
            });
        }
    }
    
    activateBidButtons(highBid, dealer, userSeat = 0) {
        this.userSeat = userSeat;
        console.log('counting '+this.buttons.length+' buttons');
        if (this.buttons.length == 2) { //2) { // if all we have is a Deal and Link button -- if this is the first button added
            this.drawBidButtons();      // then we have to draw them first    
        }
        if (this.buttons[2].alpha == 0) {
            this.raiseBidButtons();    
        }
        this.buttons[2].setTint().setInteractive(); // Pass button is always an option
        if ((highBid < 30) || ((dealer == this.game.mySeat) && (highBid == 30))) {
            this.buttons[5].setTint().setInteractive();
        }
        if ((highBid < 25) || ((dealer == this.game.mySeat) && (highBid == 25))) {
            this.buttons[4].setTint().setInteractive();
        }
        if ((highBid < 20) || ((dealer == this.game.mySeat) && (highBid == 20))) {
            this.buttons[3].setTint().setInteractive();
        }
    }
    
    hideBidButtons() {
        this.game.tweens.add({
            targets: [this.buttons[2], this.buttons[3], this.buttons[4], this.buttons[5], this.r[2], this.r[3], this.r[4], this.r[5]],
            alpha: 0,
            ease: 'Power1',
            duration: 300
        });
    }
    
    raiseBidButtons() {
        for (let i = 2; i < 6; i++) {
            this.buttons[i].setTint(0x888888).disableInteractive();    // start out disabled
        }
        this.game.tweens.add({
            targets: [this.buttons[2], this.buttons[3], this.buttons[4], this.buttons[5], this.r[2], this.r[3], this.r[4], this.r[5]],
            alpha: 1,
            ease: 'Power1',
            duration: 300
        });
    }

    raiseSuitButtons(scene) {
        //tween.remove();
        console.log('raising the suit buttons');
        let self = this;
        
        scene.tweens.add({
            targets: [this.buttons[6], this.buttons[7], this.buttons[8], this.buttons[9]],
            alpha: 1,
            ease: 'Power1',
            duration: 300
        });
        for (var i = 6; i < 10; i++) {
            this.buttons[i].setInteractive();
        }
    }
    
    hideDealButton() {
        this.game.tweens.add({
            targets: [this.buttons[0], this.r[0]],
            alpha: 0,
            ease: 'Power1',
            duration: 300
        });
    } 

    drawDealButton() {
        this.buttons.push(this.game.add.bitmapText(this.x + 150, this.y, 'gothic2', 'Deal', 48).setDepth(1).setAlpha(0).setInteractive());
        this.r.push(this.game.add.rectangle(this.buttons[0].x + 50, this.buttons[0].y + 35, this.buttons[0].width + 30, this.buttons[0].height + 10, 0x555555).setAlpha(0)); 
        let self = this;
        this.buttons[0].on('pointerover', function() {
            self.r[0].setFillStyle(0x000000);
        });
        this.buttons[0].on('pointerout', function() {
            self.r[0].setFillStyle(0x555555);
        });
        this.buttons[0].on('pointerdown', function() {
            self.hideDealButton();
            self.game.distributeCards();
        });
            
        this.buttons.push(this.game.add.image(80, 50, 'join').setTint(0xff3333).setVisible(false).setInteractive());
        this.r.push(this.game.add.rectangle(10,10,10,10, 0x555555).setVisible(false));
    }
    
    activateDiscardButton() {
        this.buttons[10].setVisible(true);
        this.r[6].setVisible(true);
        let self = this;
        this.game.tweens.add({
            targets: [this.buttons[10], this.r[6]],
            alpha: 1,
            ease: 'Power1',
            duration: 300,
            onComplete: function() {
                self.buttons[10].setInteractive();
            }
        });
        
    }
    
    hideDiscardButton(b, rlen) {
        this.buttons[b].setAlpha(0).setVisible(false);
        this.r[rlen].setAlpha(0).setVisible(false);
    } 
    
    activateDealButton(tween, targets, g, r, firstClick = true) {    
        g.tweens.add({
            targets: [this.buttons[0], this.r[0]],
            alpha: 1,
            ease: 'Power1',
            duration: 300
        });
        let self = this;
        this.buttons[0].on('pointerover', function() {
            r[0].setFillStyle(0x000000);
        });
        this.buttons[0].on('pointerout', function() {
            r[0].setFillStyle(0x555555);
        });
        this.buttons[0].off('pointerdown');
        this.buttons[0].on('pointerdown', function() {
            g.tweens.add({
                targets: [this, self.r[0]],
                alpha: 0,
                ease: 'Power1',
                duration: 300,
            });
            self.hideDealButton();
            g.socket.emit("dealButton", g.mySeat);   
        });
    }
    
    popupText(text) {
        let page = this.game.add.rectangle(640, 450, 400, 100, 0xffffff);
        let words = this.game.add.bitmapText(640, 450, 'gothic2', text, 48).setTint(0x000000);
        this.game.tweens.add({   
            targets: [page, words],
            alpha: 0,
            ease: 'Power1',
            duration: 1000,
            delay: 3000
        });
    }
    
   
}
