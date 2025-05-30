const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const users = {};

app.use(express.static('client'));

io.on('connection', (socket) => {
  let userName = '';

  socket.on('join', (name) => {
    userName = name;
    users[socket.id] = name;
    socket.broadcast.emit('new-user', name);
    io.emit('users', Object.values(users));
  });

  socket.on('signal', ({ to, data }) => {
    const targetSocketId = Object.keys(users).find(id => users[id] === to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('signal', { from: users[socket.id], data });
    }
  });

  socket.on('disconnect', () => {
    delete users[socket.id];
    io.emit('users', Object.values(users));
  });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
