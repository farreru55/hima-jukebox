const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const axios = require('axios'); // BARU: Panggil axios
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let playlist = []; 
let currentSong = null;

function getYouTubeID(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : false;
}

// BARU: Fungsi ambil judul dari YouTube tanpa API Key
async function getYoutubeTitle(videoId) {
    try {
        const url = `https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${videoId}&format=json`;
        const response = await axios.get(url);
        return response.data.title;
    } catch (error) {
        return `Lagu ID: ${videoId}`; // Kalau gagal, balik ke ID aja
    }
}

io.on('connection', (socket) => {
    console.log('User connected');

    socket.emit('update_queue', { playlist, currentSong });

    // Ubah jadi ASYNC biar bisa await
    socket.on('request_song', async (url) => {
        const videoId = getYouTubeID(url);
        
        if (videoId) {
            // Cek duplikat
            const exists = playlist.some(s => s.id === videoId) || (currentSong && currentSong.id === videoId);
            
            if (!exists) {
                // BARU: Ambil judul dulu sebelum push
                const title = await getYoutubeTitle(videoId);

                const songData = { 
                    id: videoId, 
                    title: title, // Simpan judul asli
                    requester: socket.id // Opsional: catat siapa yg request
                };
                
                playlist.push(songData);
                
                io.emit('update_queue', { playlist, currentSong });
                console.log(`Menambahkan: ${title}`);
            }
        }
    });

    socket.on('song_ended', () => {
        if (playlist.length > 0) {
            currentSong = playlist.shift(); 
            io.emit('play_next', currentSong); 
            io.emit('update_queue', { playlist, currentSong }); 
        } else {
            currentSong = null;
            io.emit('update_queue', { playlist, currentSong });
        }
    });
});

server.listen(3000, () => {
    console.log('Jukebox jalan di http://localhost:3000');
});