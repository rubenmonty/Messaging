var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose'),
    users = [];
mongoose.connect('mongodb://user:user@ds019678.mlab.com:19678/trial0295', function (err) {
    if (err) {
        console.log(err);
        throw err;
    } else {
        console.log('Connected to mongodb!');
    }
});

http.listen(3000);

var chatSchema = mongoose.Schema({
    nick: String,
    msg: String,
    created: {type: Date, default: Date.now}
});

var Chat = mongoose.model('Message', chatSchema);

app.get('/', function (req, res) {
    res.sendfile('index.html');
});

io.on('connection', function (socket) {
    var query = Chat.find({});
    query.sort('-created').limit(10).exec(function (err, docs) {
        if (err) throw err;
        socket.emit('load old msgs', docs);
    });

    socket.on('adduser', function (data, callback) {
        if (data in users) {
            callback(false);
        } else {
            callback(true);
            socket.nickname = data;
            users[socket.nickname] = socket;
            updateNicknames();
        }
    });

    function updateNicknames() {
        io.sockets.emit('usernames', Object.keys(users));
    }

    socket.on('newMessage', function (msg) {
        var newMsg = new Chat({msg: msg, nick: socket.nickname});
        newMsg.save(function(err){
            if(err) throw err;
            io.sockets.emit('chat message', {msg: msg, nick: socket.nickname});
        });
    });

    socket.on('disconnect', function (data) {
        if(!socket.nickname) return;
        delete users[socket.nickname];
        updateNicknames();
    });
});