const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const hostname = '127.0.0.1';
const port = 3000;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const indexRouter = require('./routes/index');

app.use('/node_modules', express.static(path.join(__dirname, '/node_modules')));
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static("views"));
app.use(express.static("public"));

app.use('/', indexRouter);

io.on("connection", (socket) => {
    socket.on("new join room", (preJoinRoom, newJoinRoom, name) => {
        if (!name || typeof name !== "string" || !name.trim()) return;
        if (!newJoinRoom || typeof newJoinRoom !== "string" || !newJoinRoom.trim()) return;

        socket.name = sanitizeUsername(name);

        socket.join(newJoinRoom);
        socket.room = newJoinRoom;

        const newRoomClients = io.sockets.adapter.rooms.get(newJoinRoom);
        const { currentChatRoomUserList, roomClientsNum } = getRoomInfo(newRoomClients);

        io.to(newJoinRoom).emit(
            "notice",
            currentChatRoomUserList,
            roomClientsNum,
            socket.name,
            " 님이 들어왔습니다"
        );

        if (preJoinRoom) {
            socket.leave(preJoinRoom);

            const prevRoomClients = io.sockets.adapter.rooms.get(preJoinRoom);
            const prevRoomInfo = getRoomInfo(prevRoomClients);

            io.to(preJoinRoom).emit(
                "notice",
                prevRoomInfo.currentChatRoomUserList,
                prevRoomInfo.roomClientsNum,
                socket.name,
                " 님이 나갔습니다"
            );
        }
    });

    socket.on("chat message", (msg) => {
        if (!socket.room) return;
        if (!msg || typeof msg !== "string" || !msg.trim()) return;

        const time = getFormattedTime();
        io.to(socket.room).emit("chat message", socket.name, msg.trim(), time);
    });

    socket.on("disconnect", () => {
        const room = socket.room;
        if (!room || !socket.name) return;

        const clients = io.sockets.adapter.rooms.get(room);
        const { currentChatRoomUserList, roomClientsNum } = getRoomInfo(clients);

        socket.to(room).emit(
            "notice",
            currentChatRoomUserList,
            roomClientsNum,
            socket.name,
            " 님이 나갔습니다"
        );
    });
});

function getRoomInfo(clients) {
    const names = [];

    if (clients) {
        clients.forEach((socketId) => {
            const clientSocket = io.sockets.sockets.get(socketId);
            if (clientSocket?.name) {
                names.push(clientSocket.name);
            }
        });
    }

    return {
        roomClientsNum: names.length,
        currentChatRoomUserList: names.join(", ")
    };
}

function getFormattedTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? '오후' : '오전';
    const displayHours = hours % 12 || 12;
    const formattedTime = `${ampm} ${displayHours}:${minutes}`;
    return formattedTime;
}

function sanitizeUsername(name) {
    return name
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[<>]/g, "")
        .slice(0, 20);
}

server.listen(port, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

module.exports = app;