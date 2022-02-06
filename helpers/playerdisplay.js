export default class PlayerDisplay {
    constructor(playerArray, scene) {
        this.timeBar = [];
        this.bubbleText = [];
        this.nameText = [];
        this.avatar = [];
        this.character = [];
        this.scene = scene;
        this.activePlayer = -1;
        this.timerTween = [null,null,null,null];
        
        for (let i = 0; i < 4; i++) {   // Initialize the interface
            this.nameText.push(scene.add.bitmapText(playerArray[i].x - 22, playerArray[i].y - 20, 'gothic2', '', 24));
            this.nameText[i].setDepth(2001);
            this.bubbleText.push(scene.add.bitmapText(playerArray[i].x + 104, playerArray[i].y - 25, 'gothic2', '', 32).setAlpha(0).setDepth(2001));
            this.avatar.push(scene.add.rectangle(playerArray[i].x + 70, playerArray[i].y, 210, 60, 0xffffff));
            this.avatar[i].setFillStyle(0x222222).setDepth(2000).setAlpha(0.75).setInteractive();    // 0.75 alpha is the active look
            this.avatar[i].on('pointerover', function () {
                if (this.fillColor == (0x222222)) {
                    this.setFillStyle(0x00AA00);
                }
            });      
            this.avatar[i].on('pointerout', function () {
                if (this.fillColor == (0x00AA00)) {
                    this.setFillStyle(0x222222);
                }
            });    
            self = this;
            this.avatar[i].on('pointerdown', function () {
                this.setFillStyle(0x007700);    // shade green and block the other seats
                self.avatar[0].disableInteractive();  
                self.avatar[1].disableInteractive();  
                self.avatar[2].disableInteractive();  
                self.avatar[3].disableInteractive();
                self.character[i].setVisible(false);    
                scene.mySeat = i;
                scene.socket.emit('takeSeat', i);    // Tell the server you reserved a seat
                
                scene.tweens.add({
                    targets: [self.scene.instructions_text, self.instructions_panel],
                    alpha: 0,
                    yoyo: true,
                    ease: 'Power1',
                    duration: 300,
                    onYoyo: function () {
                            self.scene.instructions_text.setX(485).setY(360).setText("Enter your name");
                            self.scene.instructions_panel.setY(365).setSize(400,210);
                    },
                    onComplete: function () {
                            self.element = scene.add.dom(self.avatar[0].x, self.avatar[1].y+40).createFromCache('nameform');
                            var el = document.createElement('select');
                            self.element.setPerspective(800);
                            self.element.addListener('click');
                            self.element.on('click', function (event) {
                                if (event.target.name === 'playButton')
                                {
                                    var inputText = this.getChildByName('nameField');
                                    //  Have they entered anything?
                                    if (inputText.value !== '')
                                    {
                                        console.log('Set your name. inputText.value '+inputText.value+ ' i '+i);
                                        //  Turn off the click events
                                        this.removeListener('click');
                        
                                        //  Hide the login element
                                        this.setVisible(false);
                                        scene.instructions_panel.setVisible(false);
                                        self.scene.instructions_text.setVisible(false);
                        
                                        //  Populate the name bar with whatever they typed in
                                        self.nameText[i].setText(inputText.value);
                                        self.character[i].setVisible(false);
                                        scene.socket.emit('setName', scene.mySeat, inputText.value); // Tell the server you now have a name
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
            
            this.timeBar.push(scene.add.rectangle(playerArray[i].x + 70, playerArray[i].y + 25, 210, 10, 0xffffff));
            this.timeBar[i].setFillStyle(0xdddddd).setDepth(2001);
            this.character.push(scene.add.image(playerArray[i].x + 0, playerArray[i].y - 5, 'robot_' + i).setDisplaySize(50, 50).setDepth(2001));
        }
    }
    
    seatTaken(seat) {
        this.avatar[seat].disableInteractive();
        this.character[seat].setVisible(false);    
        if (this.scene.mySeat != seat) {
            this.avatar[seat].setFillStyle(0x770000); // shade it red
        }
    }
    playerLeft(seat) {
        this.avatar[seat].setInteractive();
        this.avatar[seat].setFillStyle(0x222222);   // shade it grey again
        this.character[seat].setVisible(true);      // add a robot
        this.nameText[seat].setText();
    }    
    
    setName(seat, name) {
        if (this.scene.mySeat != seat) {
            this.nameText[seat].setText(name);
            this.character[seat].setVisible(false);    
        }
    }
    
    activate(seat) {
        this.activePlayer = seat;
        this.timeBar[seat].setFillStyle(0x00FF00);
        this.timeBar[seat].width = 210;
        this.timeBar[(seat + 1) % 4].setFillStyle(0xFFFFFF);
        this.timeBar[(seat + 1) % 4].width = 210;
        this.timeBar[(seat + 2) % 4].setFillStyle(0xFFFFFF);
        this.timeBar[(seat + 2) % 4].width = 210;
        this.timeBar[(seat + 3) % 4].setFillStyle(0xFFFFFF);
        this.timeBar[(seat + 3) % 4].width = 210;
    }
    activateAll() {
        this.activePlayer = 5;  // This means all
        this.timeBar[0].setFillStyle(0x00FF00);
        this.timeBar[0].width = 210;
        this.timeBar[1].setFillStyle(0x00FF00);
        this.timeBar[1].width = 210;
        this.timeBar[2].setFillStyle(0x00FF00);
        this.timeBar[2].width = 210;
        this.timeBar[3].setFillStyle(0x00FF00);
        this.timeBar[3].width = 210;
    }
    deactivateTimer(seat) {
        //console.log('deactivateTimer('+seat+') this.timebar size is ' + this.timeBar[seat].width+'. counting '+this.scene.tweens.getTweensOf(this.timeBar[seat]).length+' tweens');
        this.timerTween[seat].stop();
        this.timeBar[seat].setFillStyle(0xFFFFFF);
        this.timeBar[seat].width = 210;
    }
    setTimer(seat, timeRemaining = 0) {
        //console.log('setTimer tweens: ' +this.timerTween);

        for (var i=0;i<4;i++) {
            if (this.timerTween[i] != null) {
                //console.log('stopping tween '+i);
                this.timerTween[i].stop();
                this.timerTween[i] = null;
            }
        }
        this.timeBar[seat].width = 210;  
        this.timerTween[seat] = this.scene.tweens.add({   
            targets: this.timeBar[seat],
            width: 0,
            ease: 'linear',
            duration: 30000,
            /*onComplete: () => {
                //console.log('color '+this.timeBar[seat].color+' tint '+this.timeBar[seat].tintTopLeft);
                if ((this.activePlayer != seat) && (this.activePlayer != 5)) {   // Don't let display lag leave an inactive avatar with low timeBar
                    this.timeBar[seat].width = 210;  
                }
                if (this.activePlayer == 5) {
                    console.log('5:this.timebar size for seat ' + seat+' is ' + this.timeBar[seat].width+'. counting '+this.scene.tweens.getTweensOf(this.timeBar[seat]).length+' tweens');
                }
            }, callbackScope: this*/
        });
    }
    setAllTimers() {
        //console.log('setAllTimers all timers tick');
        for (var i=0;i<4;i++) {
            if (this.timerTween[i] != null) {
                //console.log('stopping tween '+i);
                this.timerTween[i].stop();
                this.timerTween[i] = null;
            }
        }       
        for (var i=0;i<4;i++) {
            this.timeBar[i].width = 210;  
            this.timerTween[i] = this.scene.tweens.add({   
                targets: this.timeBar[i],
                width: 0,
                ease: 'linear',
                duration: 30000,
            });
        }
        
    }
    setBidText(player, bid) {
        this.timeBar[player]. width = 210;
        var bidText = (bid == 0) ? 'Pass' : ' ' + bid;
        this.bubbleText[player].setText(bidText);
        let tween = this.scene.add.tween({
            targets: this.bubbleText[player], 
            duration: 300, 
            ease: 'Exponential.In',
            alpha : 1
        });        
    }
    
    clearBids() {
        for (var s = 0; s < 4; s++) {
            this.bubbleText[s].setText('');
            if (this.timerTween[s] != null) {
                this.timerTween[s].stop();
            }
            this.timeBar[s].setFillStyle(0xFFFFFF);
            this.timeBar[s].width = 210;       
        }
    }
    
    addSuitSymbol(player, bid, suit) {
        var bidText = (bid == 0) ? '' : ' ' + bid;
        var symbol;
        if (suit == 0) {
            symbol = '&'; //clubs
        } else if (suit == 1) {
            symbol = '#'; // hearts
        } else if (suit == 2) {
            symbol = '+'; // spades
        } else if (suit == 3){
            symbol = '@'; // diamonds
        } else {
            symbol = 'X';
        }
        this.bubbleText[player].setText(bidText + symbol);    
        this.bubbleText[(player + 1) % 4].setText('');
        this.bubbleText[(player + 2) % 4].setText('');    
        this.bubbleText[(player + 3) % 4].setText('');    
    }
    removeNameField() {
        this.element.setVisible(false);
    }
    

}