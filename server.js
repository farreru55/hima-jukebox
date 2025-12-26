const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Folder public untuk file html/css/js client
app.use(express.static('public'));

// SIMPAN ANTRIAN DI MEMORY SERVER (RAM)
let playlist = []; 
let currentSong = null;

// Helper: Ambil ID YouTube dari Link yang aneh-aneh
function getYouTubeID(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : false;
}

io.on('connection', (socket) => {
    console.log('User connected');

    // 1. Kirim data antrian saat pertama kali buka
    socket.emit('update_queue', { playlist, currentSong });

    // 2. Event saat Guest Request Lagu
    socket.on('request_song', (url) => {
        const videoId = getYouTubeID(url);
        if (videoId) {
            // Cek apakah lagu sudah ada di antrian biar ga dobel
            const exists = playlist.some(s => s.id === videoId) || (currentSong && currentSong.id === videoId);
            if (!exists) {
                const songData = { id: videoId, title: `Lagu ID: ${videoId}` }; // Nanti bisa upgrade ambil judul asli via API
                playlist.push(songData);
                
                // Teriak ke SEMUA orang (Host & Guest) ada lagu baru
                io.emit('update_queue', { playlist, currentSong });
                console.log(`Lagu ditambahkan: ${videoId}`);
            }
        }
    });

    // 3. Event saat Lagu di Host Selesai (Minta Next)
    socket.on('song_ended', () => {
        if (playlist.length > 0) {
            currentSong = playlist.shift(); // Ambil & hapus antrian terdepan
            io.emit('play_next', currentSong); // Suruh Host play
            io.emit('update_queue', { playlist, currentSong }); // Update UI semua orang
        } else {
            currentSong = null;
            io.emit('update_queue', { playlist, currentSong });
        }
    });
});

server.listen(3000, () => {
    console.log('Jukebox jalan di http://localhost:3000');
});