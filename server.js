const server = require('express')();
const http = require('http').createServer(server);
const io = require('socket.io')(http);
let players = [];
let names = ['','','',''];

server.get('/', function(req, res) {
   res.sendfile('client/index.js');
});

var roomno = 1;
var boardCount = [];
boardCount[roomno] = 0;

io.on('connection', function (socket) {
    console.log('A user connected: ' + socket.id);
    if (players.length == 0) {
        names = ['','','',''];
    }
    
    players.push(socket.id);
    //Increase roomno if 4 clients are present in a room.
    if(io.nsps['/'].adapter.rooms["room-"+roomno] && io.nsps['/'].adapter.rooms["room-"+roomno].length > 3)     roomno++;
    socket.join("room-"+roomno);
    console.log('Joining room no. ' + roomno + ' in seat ' + (players.length - 1));
    //Send this event to everyone in the room.
    io.sockets.in("room-"+roomno).emit('connectToRoom', 'You are in room no. ' + roomno + ' in seat ' + (players.length - 1) % 4);
        
    io.sockets.in("room-"+roomno).emit('tookSeat', (players.length - 1) % 4);
    
    socket.on('setName', function(seat, name) {
        names[seat] = name;
        for (let i = 0; i < names.length; i++) {
            if (names[i] != '') {
                io.sockets.in("room-"+roomno).emit('setName', i, names[i]);    
            }
        }     
    });
    
    socket.on('dealCards', function (seat, rank, suit, value, location = -1) {
        //console.log('received ' + rank + ' of ' + suit + ' for seat ' + seat);
        io.sockets.in("room-"+roomno).emit('dealCards', seat, rank, suit, value, location);
    });
    
    socket.on('showBid', function (seat, bid) {
        //console.log('received ' + bid + ' from ' + seat);
        io.sockets.in("room-"+roomno).emit('showBid', seat, bid);
    });
    socket.on('requestBid', function (seat, highBid, dealer) {
        //console.log('received request for player ' + seat + ' to bid');
        io.sockets.in("room-"+roomno).emit('requestBid', seat, highBid, dealer);
    });
    socket.on('whichSuit', function (seat, highBid) {
        //console.log('received request for suits');
        io.sockets.in("room-"+roomno).emit('requestSuit', seat, highBid);
    });
    socket.on('showSuit', function (seat, highBidder, highBid, bestSuit) {
        //console.log('received request to display the selected suit ' + bestSuit);
        io.sockets.in("room-"+roomno).emit('showSuit', seat, highBidder, highBid, bestSuit);
    });   
    
    socket.on('announceDiscards', function (seat, discards) {
        //console.log('received discards from ' + seat);
        io.sockets.in("room-"+roomno).emit('announceDiscards', seat, discards);
    });   
    
    socket.on('yourPlay', function (seat, trump, trumped, leadpoints) {
        io.sockets.in("room-"+roomno).emit('yourPlay', seat, trump, trumped, leadpoints);
    });
    
    socket.on('cardPlayed', function (seat, cardIndex) {
        io.sockets.in("room-"+roomno).emit('cardPlayed', seat, cardIndex);
    });
    
    socket.on('trickOver', function (winner) {
        io.sockets.in("room-"+roomno).emit('trickOver', winner);
    });
    
    socket.on('boardClear', function (seat) {
        boardCount[roomno]++;
        console.log(boardCount[roomno] + ' players cleared the trick.');
        if (boardCount[roomno] == 4) {
            console.log('all tricks cleared - move to next trick');
            boardCount[roomno] = 0;
            io.sockets.in("room-"+roomno).emit('startNextTrick');
        }
    
    });    
    
    socket.on('handOver', function (bidderScore, nonBidderScore) {
        io.sockets.in("room-"+roomno).emit('handOver', bidderScore, nonBidderScore);
    });  
    
    socket.on('updateScore', function (bidderScore, nonBidderScore) {
        io.sockets.in("room-"+roomno).emit('updateScore', bidderScore, nonBidderScore);
    });     
    socket.on('misdeal', function () {
        io.sockets.in("room-"+roomno).emit('misdeal');
    });       

    socket.on('disconnect', function () {
        console.log('A user disconnected: ' + socket.id);
        players = players.filter(player => player !== socket.id);
    });
});

http.listen(8082, function () {
    console.log(`Server started ${http.address().port}`);
});