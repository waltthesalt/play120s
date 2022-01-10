export default class InfoBar {
    constructor(game) {
        
        game.bidButtons = []; 
        game.graphics = game.add.graphics({ x: 0, y: 0, fillStyle: { color: 0x000000, alpha: 0.6 }, lineStyle: { color: 0x00ff00 } });
        //this.graphics = graphics;
        var x = game.players[0].x - 130;
        var y = game.players[0].y + 125;
        this.infoY = y;
        var buttonLabels = ['Pass', '20', '25', '30'];
        game.graphics.fillStyle(0x555555, 1);
        for (var i = 0; i< 4; i++) {
            game.bidButtons.push(game.add.bitmapText(x, y, 'gothic2', buttonLabels[i], 48)); 
            if (i > 0) {
                game.bidButtons[i].setTint(0x888888);
            } else {
                x = x + 42;
                game.bidButtons[i].setTint(0x888888);
            }
            var bounds = game.bidButtons[i].getTextBounds();
            
            game.graphics.fillRect(bounds.global.x - 10, bounds.global.y, bounds.global.width + 20, bounds.global.height + 10);
            //console.log('bound set at ' + bounds.global.y + ' ' + bounds.global.height + 10);
            x = x + 100;
        }

        //this.game = game;
        //var gr = this.graphics;
        //self = this;
        // now, listen for events on the buttons
        for (var i = 0; i < 4; i++) {
            game.bidButtons[i].on('pointerover', function () {
                game.graphics.fillStyle(0x000000);
                //console.log('rolled over');
                var bounds = this.getTextBounds();
                game.graphics.fillRect(bounds.global.x - 10, bounds.global.y, bounds.global.width + 20, bounds.global.height + 10);
            })
            game.bidButtons[i].on('pointerout', function () {
                game.graphics.fillStyle(0x555555);
                //console.log('rolled over');
                var bounds = this.getTextBounds();
                game.graphics.fillRect(bounds.global.x - 10, bounds.global.y, bounds.global.width + 20, bounds.global.height + 10);
            })
        }
        
        game.bidButtons[0].on('pointerdown', function () {
            game.players[0].bid = 0;
            game.registerBid(0);
        })     
        game.bidButtons[1].on('pointerdown', function () {
            game.players[0].bid = 20;
            game.registerBid(20);
        })
        game.bidButtons[2].on('pointerdown', function () {
            game.players[0].bid = 25;
            game.registerBid(25);
        })
        game.bidButtons[3].on('pointerdown', function () {
            game.players[0].bid = 30;
            game.registerBid(30);
        })
        //console.log('infoY is set up as ' + this.infoY);
    }
    
    activateBidButtons(highBid, dealer, g) {
        g.bidButtons[0].setTint().setInteractive();
        if ((highBid < 30) || ((dealer == 0) && (highBid == 30))) {
            g.bidButtons[3].setTint().setInteractive();
        }
        if ((highBid < 25) || ((dealer == 0) && (highBid == 25))) {
            g.bidButtons[2].setTint().setInteractive();
        }
        if ((highBid < 20) || ((dealer == 0) && (highBid == 20))) {
            g.bidButtons[1].setTint().setInteractive();
        }
    }
    
    hideBidButtons(g) {
        g.tweens.add({
            targets: [g.bidButtons[0], g.bidButtons[1], g.bidButtons[2], g.bidButtons[3]],
            y: 901,
            ease: 'Power1',
            duration: 300,
            onComplete: this.activateDealButton,
            onCompleteParams: [g]
        });
        g.tweens.add({
            targets: g.graphics,
            y: 111,
            ease: 'Power1',
            duration: 300
        });
    }
    
    raiseBidButtons(g) {
        g.tweens.add({
            targets: [g.bidButtons[0], g.bidButtons[1], g.bidButtons[2], g.bidButtons[3]],
            y: g.players[0].y + 125,
            ease: 'Power1',
            duration: 3000
        });
        g.tweens.add({
            targets: g.graphics,
            y: 0,
            ease: 'Power1',
            duration: 3000
        });
    }

    activateSuitButtons(g) {
        //console.log('activating suit buttons at ' + this.infoY);
        var localY = this.infoY;
        g.tweens.add({
            targets: [g.bidButtons[0], g.bidButtons[1], g.bidButtons[2], g.bidButtons[3]],
            y: 901,
            ease: 'Power1',
            duration: 300,
            onComplete: this.raiseSuitButtons,
            onCompleteParams: [g, localY]
        });
        g.tweens.add({
            targets: g.graphics,
            y: 111,
            ease: 'Power1',
            duration: 300
        });
    }

    raiseSuitButtons(tween, targets, game, y) {
        //console.log('raising suit buttons at ' + y);
        //console.log('tween is a type ' + typeof(tween));
        for (var i = 0;i< 4;i++) {
            targets[i].setVisible(false).setInteractive(false);
        }
        game.graphics.clear();
        tween.remove();
        game.sym = [];
        game.sym.push(game.add.image(485, y + 138, 'clubs').setInteractive().setData('suitCode',0));
        game.sym.push(game.add.image(585, y + 138, 'hearts').setInteractive().setData('suitCode',1));
        game.sym.push(game.add.image(685, y + 138, 'spades').setInteractive().setData('suitCode',2));
        game.sym.push(game.add.image(785, y + 138, 'diamonds').setInteractive().setData('suitCode',3));
        
        game.tweens.add({
            targets: [game.sym[0], game.sym[1], game.sym[2], game.sym[3]],
            y: 830,
            ease: 'Power1',
            duration: 300,
            onComplete: function(tween) {
                tween.remove();        
                
            }   
        });
        for (var i = 0; i < 4; i++) {
            game.sym[i].on('pointerover', function () {
                this.setTint(0xBBBBBB);
            })
            game.sym[i].on('pointerout', function () {
                this.setTint();
            })
            game.sym[i].on('pointerdown', function () {
                this.setTint(0x999999);
                game.players[0].bestSuit = this.getData('suitCode');
                //console.log('suitCode = ' + this.getData('suitCode'));
                game.tweens.add({
                    targets: [game.sym[0], game.sym[1], game.sym[2], game.sym[3]],
                    y: 901,
                    ease: 'Power1',
                    duration: 300,
                    onComplete: function () {
                        for (var j = 0;j < 4; j++) {
                            game.sym[j].setInteractive(false).setVisible(false);
                        }
                    }
                });
                game.showSuit();
            })
        }
    }
    
    hideDealButton(g) {
        g.tweens.add({
            targets: g.dButton,
            y: 901,
            ease: 'Power1',
            duration: 300,
        });
        g.tweens.add({
            targets: g.graphics,
            y: 111,
            ease: 'Power1',
            duration: 300,
        });

    } 

    activateDealButton(tween, targets, g, firstClick = true) { 
        for (var i = 0;i< 4;i++) {
            //targets[i].setVisible(false).setInteractive(false);
        }     
        //tween.remove();
        //console.log('here g is a ' + typeof(g));
        var dButton = g.add.bitmapText(g.players[0].x + 20, g.players[0].y + 231, 'gothic2', 'Deal', 48);
        var gr = g.graphics;
        gr.clear();
        gr.fillStyle(0x555555, 1);
        var bounds = dButton.getTextBounds();
        //console.log(bounds.global.y);
        gr.fillRect(bounds.global.x - 10, bounds.global.y - 106, bounds.global.width + 20, bounds.global.height + 10);
        g.tweens.add({
            targets: dButton,
            y: 805,
            ease: 'Power1',
            duration: 300,
            onComplete: function () {
                dButton.setInteractive();   // don't let them use the button until it's up
            }
        });
        g.tweens.add({
            targets: gr,
            y: 0,
            ease: 'Power1',
            duration: 300
        });
        dButton.on('pointerover', function() {
            gr.fillStyle(0x000000);
            //console.log('rolled over');
            var bounds = this.getTextBounds();
            gr.fillRect(bounds.global.x - 10, bounds.global.y, bounds.global.width + 20, bounds.global.height + 10);        
        });
        dButton.on('pointerout', function() {
            gr.fillStyle(0x555555);
            //console.log('rolled out');
            var bounds = this.getTextBounds();
            gr.fillRect(bounds.global.x - 10, bounds.global.y, bounds.global.width + 20, bounds.global.height + 10);        
        });
        dButton.on('pointerdown', function() {
            g.tweens.add({
                targets: this,
                y: 901,
                ease: 'Power1',
                duration: 300,
            });
            g.tweens.add({
                targets: g.graphics,
                y: 111,
                ease: 'Power1',
                duration: 300,
            });            
            if (firstClick) { 
                g.fillHands();
            } else {
                for (var cd = 0; cd < 5; cd++) {
                    for (var pl = 0; pl < 5; pl++) {
                        if (((g.dealer + 1 + pl) % 5 < 4) || (cd < 3)) { // don't put too many in kit
                            g.players[(g.dealer + 1 + pl) % 5].playerCards[cd].pic.setDepth(g.players[(g.dealer + 1 + pl) % 5].x + cd * 36);
                            g.tweens.add({   
                                targets: g.players[(g.dealer + 1 + pl) % 5].playerCards[cd].pic,
                                x: g.players[(g.dealer + 1 + pl) % 5].x + cd * 36,
                                y: g.players[(g.dealer + 1 + pl) % 5].y,
                                ease: 'Power1',
                                duration: 300,
                                delay: cd * 200 + pl * 30,
                                onComplete: g.restart
                            });
                        }
                    }
                }
                //raiseBidButtons(g);
            }
        });
    }
    
   
}
