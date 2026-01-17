const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const socketHandler = require('./src/socket/socketHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Initialize socket event handlers
socketHandler.initialize(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});