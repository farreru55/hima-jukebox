const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const axios = require('axios');
const yts = require('yt-search'); // BARU: Library pencari
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let playlist = []; 
let currentSong = null;

// Regex untuk cek apakah input adalah URL
function isUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Logic ambil ID dari Link (Cara Lama)
function getYouTubeID(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : false;
}

// Logic ambil metadata dari ID (Cara Lama)
async function getYoutubeMetadata(videoId) {
    try {
        const url = `https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${videoId}&format=json`;
        const response = await axios.get(url);
        return {
            title: response.data.title,
            artist: response.data.author_name
        };
    } catch (error) {
        return { title: `Lagu ID: ${videoId}`, artist: 'Unknown' };
    }
}

// BARU: Logic Cari Lagu berdasarkan Judul
async function searchSong(query) {
    try {
        const r = await yts(query);
        const videos = r.videos;
        
        if (videos.length > 0) {
            // Ambil video urutan pertama
            const topResult = videos[0];
            return {
                id: topResult.videoId,
                title: topResult.title,
                artist: topResult.author.name
            };
        } else {
            return null;
        }
    } catch (e) {
        console.log("Search error:", e);
        return null;
    }
}

io.on('connection', (socket) => {
    console.log('User connected');
    socket.emit('update_queue', { playlist, currentSong });

    socket.on('request_song', async (input) => {
        let songData = null;

        // CEK: Apakah input User itu Link atau Tulisan Biasa?
        if (isUrl(input)) {
            // --- JALUR LINK ---
            const videoId = getYouTubeID(input);
            if (videoId) {
                const metadata = await getYoutubeMetadata(videoId);
                songData = {
                    id: videoId,
                    title: metadata.title,
                    artist: metadata.artist,
                    requester: socket.id
                };
            }
        } else {
            // --- JALUR PENCARIAN (Judul) ---
            console.log(`Mencari: ${input}`);
            const result = await searchSong(input);
            if (result) {
                songData = {
                    id: result.id,
                    title: result.title,
                    artist: result.artist,
                    requester: socket.id
                };
            }
        }

        // PROSES MASUK ANTRIAN
        if (songData) {
            // Cek duplikat
            const exists = playlist.some(s => s.id === songData.id) || (currentSong && currentSong.id === songData.id);
            
            if (!exists) {
                playlist.push(songData);
                io.emit('update_queue', { playlist, currentSong });
                console.log(`Menambahkan: ${songData.title}`);
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