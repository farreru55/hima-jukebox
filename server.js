const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const axios = require('axios');
const yts = require('yt-search'); // Search Library
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let playlist = []; 
let currentSong = null;

// Regex to check if input is URL
function isUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Logic to get ID from Link
function getYouTubeID(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : false;
}

// Logic to get metadata from ID
async function getYoutubeMetadata(videoId) {
    try {
        const url = `https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${videoId}&format=json`;
        const response = await axios.get(url);
        return {
            title: response.data.title,
            artist: response.data.author_name
        };
    } catch (error) {
        return { title: `Song ID: ${videoId}`, artist: 'Unknown' };
    }
}

// Logic: Search Song by Title
async function searchSong(query) {
    try {
        const r = await yts(query);
        const videos = r.videos;
        
        if (videos.length > 0) {
            // Get first video result
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

        // Check: Is input URL or Search Term?
        if (isUrl(input)) {
            // --- URL MODE ---
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
            // --- SEARCH MODE ---
            console.log(`Searching: ${input}`);
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

        // ADD TO QUEUE PROCESS
        if (songData) {
            // Check for duplicates
            const exists = playlist.some(s => s.id === songData.id) || (currentSong && currentSong.id === songData.id);
            
            if (!exists) {
                playlist.push(songData);
                io.emit('update_queue', { playlist, currentSong });
                console.log(`Adding: ${songData.title}`);
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});