// import express, ejs, uuid
const express = require('express');
const app = express();
const { v4: uuidV4 } = require('uuid');

// set up https, via letsencrypt
const fs = require('fs');
const https = require('https');
const server = https.createServer(
  {
    key: fs.readFileSync('/etc/letsencrypt/live/your.domain.here/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/your.domain.here/cert.pem'),
    ca: fs.readFileSync('/etc/letsencrypt/live/your.domain.here/chain.pem'),
    requestCert: false,
    rejectUnauthorized: false,
  },
  app
);

// import socket io
const io = require('socket.io')(server);

app.set('view engine', 'ejs');
app.use(express.static('public'));

// redirect to random room url
app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

// roomId from url
app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room });
});

io.on('connection', (socket) => {
  // when user join-room
  socket.on('join-room', (roomId, userId) => {
    // add user to room
    socket.join(roomId);
    // broadcast to other users in same room : user-connected
    socket.to(roomId).broadcast.emit('user-connected', userId);

    // on disconnect
    socket.on('disconnect', () => {
      // broadcast to other user ins same room : user-disconnected
      socket.to(roomId).broadcast.emit('user-disconnected', userId);
    });
  });
});

// set port number
server.listen(portNumber);
