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

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`${socket.id}가 ${roomId}번 방에 입장`);
        
        const clients = io.sockets.adapter.rooms.get(roomId);
        if (clients && clients.size === 2) {
            // 두 명이 모이면 서버가 첫 번째 문제를 골라서 시작 신호를 보냄
            const firstIdx = Math.floor(Math.random() * 100); 
            io.to(roomId).emit('game-start', { firstIdx });
        }
    });

    socket.on('game-data', (data) => {
        if (data.type === 'req-next') {
            // 한 명이라도 다음 문제를 요청하면 서버가 새 번호를 생성해 방 전체에 뿌림
            const nextIdx = Math.floor(Math.random() * 100);
            io.to(data.roomId).emit('peer-data', { type: 'next', idx: nextIdx });
        } else {
            // 결과(정답/오답) 데이터는 방 전체(나 포함)에 브로드캐스트하여 동시 연출
            io.to(data.roomId).emit('peer-data', data);
        }
    });

    socket.on('disconnect', () => {
        console.log('유저 나감');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`서버 오픈: ${PORT}`));