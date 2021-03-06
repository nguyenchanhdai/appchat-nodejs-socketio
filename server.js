var express = require('express');
var app = express();
app.use(express.static('./public'));
app.set('view engine', 'ejs');
app.set('views', './views');

var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 5000;
server.listen(port);

var listUsers = [];
var listTyping = [];
var listMessages = [];

io.on('connection', function(socket) {
    console.log('Co nguoi ket noi ' + socket.id);

    socket.on('disconnect', function() {
        console.log(socket.username + ' vua ngat ket noi');
        listUsers.splice(listUsers.indexOf(socket.username), 1);
        socket.broadcast.emit('server-send-list-users', listUsers);
        if (listTyping.indexOf(socket.username) !== -1) {
            listTyping.splice(listUsers.indexOf(socket.username), 1);
            socket.broadcast.emit('server-send-stop-typing', socket.username);
        }
    });

    socket.on('client-send-username', function(data) {
        if (listUsers.indexOf(data) !== -1) {
            console.log('tai khoan da duoc su dung');
            socket.emit('server-send-register-error', {
                res: data + ' already registered',
                username: data
            });
        } else {
            socket.username = data;
            listUsers.push(data);
            socket.emit('server-send-register-success', {
                res: data + ' register successfully',
                username: data
            });
            io.sockets.emit('server-send-list-users', listUsers);
            io.sockets.emit('server-send-list-typing', listTyping);
            io.sockets.emit('server-send-list-messages', listMessages);
            console.log(listMessages);
        }
    });

    socket.on('client-send-logout', function() {
        console.log(socket.username + ' loged out ');
        listUsers.splice(listUsers.indexOf(socket.username), 1);
        socket.broadcast.emit('server-send-list-users', listUsers);
        if (listTyping.indexOf(socket.username) !== -1) {
            listTyping.splice(listTyping.indexOf(socket.username) , 1);
            socket.broadcast.emit('server-send-stop-typing', socket.username);
        }
    });

    socket.on('client-send-message', function(data) {
        io.sockets.emit('server-send-message', {
            id: socket.id,
            username: socket.username,
            message: data
        });
        listMessages.push({
            id: socket.id,
            username: socket.username,
            message: data
        });
    });

    socket.on('client-send-typing', function() {
        listTyping.push(socket.username);
        socket.broadcast.emit('server-send-typing', socket.username);
    });
    socket.on('client-send-stop-typing', function() {
        listTyping.splice(listTyping.indexOf(socket.username), 1);
        socket.broadcast.emit('server-send-stop-typing', socket.username);
    });

});

app.get('/', function(req, res) {
    res.render('app');
});
