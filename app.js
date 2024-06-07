const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const hostname = '127.0.0.1';
const port = 3000;
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let indexRouter = require('./routes/index');

app.use('/node_modules', express.static(path.join(__dirname, '/node_modules')));
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static("views"));
app.use(express.static("public"));

app.use('/', indexRouter);

// Socket.IO 설정
io.on("connection", (socket) => {
    socket.on("new join room", (preJoinRoom, newJoinRoom, name) => {
        socket.name = name;

        socket.join(newJoinRoom);
        socket.room = newJoinRoom;

        let clients = io.sockets.adapter.rooms.get(newJoinRoom);

        const { currentChatRoomUserList, roomClientsNum } = getRoomInfo(clients);

        io.to(newJoinRoom).emit(
            "notice",
            currentChatRoomUserList,
            roomClientsNum,
            socket.name,
            " 님이 들어왔습니다"
        );

        if (preJoinRoom !== "") {
            socket.leave(preJoinRoom);

            let clients = io.sockets.adapter.rooms.get(preJoinRoom);
            const { currentChatRoomUserList, roomClientsNum } = getRoomInfo(clients);

            io.to(preJoinRoom).emit(
                "notice",
                currentChatRoomUserList,
                roomClientsNum,
                socket.name,
                " 님이 나갔습니다"
            );
        }
    });

    socket.on("chat message", (msg) => {
        io.to(socket.room).emit("chat message", socket.name, msg);
    });

    socket.on("disconnect", () => {
        let clients = io.sockets.adapter.rooms.get(socket.room);
        const { currentChatRoomUserList, roomClientsNum } = getRoomInfo(clients);

        io.emit(
            "notice",
            currentChatRoomUserList,
            roomClientsNum,
            socket.name,
            " 님이 나갔습니다"
        );
    });
});

function getRoomInfo(clients) {
    const roomClientsNum = clients ? clients.size : 0;

    let currentChatRoomUserList = "";
    if (clients) {
        clients.forEach((element) => {
            currentChatRoomUserList += io.sockets.sockets.get(element).name + ", ";
        });
    }

    currentChatRoomUserList = currentChatRoomUserList.slice(0, currentChatRoomUserList.length - 2);

    return { roomClientsNum, currentChatRoomUserList };
}

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

module.exports = app;