const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, '.')));

io.on('connection', (socket) => {
    console.log('유저 접속:', socket.id);

    // 방 만들기/참가하기
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`${socket.id}가 ${roomId}번 방에 입장`);
        
        // 방에 2명이 모이면 게임 시작 신호 전송
        const clients = io.sockets.adapter.rooms.get(roomId);
        if (clients && clients.size === 2) {
            io.to(roomId).emit('game-start');
        }
    });

    // 게임 데이터 중계 (데미지, 다음 문제 등)
    socket.on('game-data', (data) => {
        socket.to(data.roomId).emit('peer-data', data);
    });

    socket.on('disconnect', () => {
        console.log('유저 나감');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`서버 오픈: ${PORT}`));