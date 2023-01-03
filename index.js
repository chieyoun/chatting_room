// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
var port = process.env.PORT || 3030;

server.listen(port, function () {
    console.log('Server listening at port', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom

// var numUsers = 0;
var roomOfUsers = {};

io.on('connection', function (socket) {
    var addedUser = false;
    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (data) {
        // we tell the client to execute 'new mesgit remote -vsage'
        socket.broadcast.in(socket.room).emit('new message', {
            username: socket.username,
            message: data
        });
    });

    socket.on('join room', function (room) {
        socket.room = room;
        if (typeof roomOfUsers[socket.room] != 'number') {
            roomOfUsers[socket.room] = 0;
        }
        socket.join(socket.room);
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function (username) {
        if (addedUser) return;

        // we store the username in the socket session for this client
        socket.username = username;
        // ++numUsers;
        ++roomOfUsers[socket.room];
        addedUser = true;
        socket.emit('login', {
            numUsers: roomOfUsers[socket.room]
            // numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.in(socket.room).emit('user joined', {
            username: socket.username,
            numUsers: roomOfUsers[socket.room]
            // numUsers: numUsers
        });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', function () {
        socket.broadcast.in(socket.room).emit('typing', {
            username: socket.username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', function () {
        socket.broadcast.in(socket.room).emit('stop typing', {
            username: socket.username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        if (addedUser) {
            // --numUsers;
            //quit room
            --roomOfUsers[socket.room];
            if (roomOfUsers[socket.room] <= 0) {
                delete roomOfUsers[socket.room];
            }
            socket.leave(socket.room);

            // echo globally that this client has left
            socket.broadcast.in(socket.room).emit('user left', {
                username: socket.username,
                numUsers: roomOfUsers[socket.room]
            });
        }
    });
});
