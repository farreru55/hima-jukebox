const playlistManager = require('../state/playlistManager');
const youtubeService = require('../services/youtubeService');

/**
 * Initializes the socket event listeners.
 * @param {Server} io - The Socket.io server instance.
 */
function initialize(io) {
    io.on('connection', (socket) => {
        console.log('User connected');
        socket.emit('update_queue', playlistManager.getQueue());

        // Listener for song requests
        socket.on('request_song', async (input) => {
            let songData = null;

            if (youtubeService.isUrl(input)) {
                const videoId = youtubeService.getYouTubeID(input);
                if (videoId) {
                    const metadata = await youtubeService.getYoutubeMetadata(videoId);
                    songData = {
                        id: videoId,
                        title: metadata.title,
                        artist: metadata.artist,
                        requester: socket.id
                    };
                }
            } else {
                console.log(`Searching: ${input}`);
                const result = await youtubeService.searchSong(input);
                if (result) {
                    songData = {
                        id: result.id,
                        title: result.title,
                        artist: result.artist,
                        requester: socket.id
                    };
                }
            }

            if (songData) {
                if (playlistManager.addSong(songData)) {
                    io.emit('update_queue', playlistManager.getQueue());
                }
            }
        });

        // Listener to remove a song from the queue
        socket.on('remove_from_queue', (index) => {
            if (playlistManager.removeSong(index) !== null) {
                io.emit('update_queue', playlistManager.getQueue());
            }
        });

        // Listener for when a song ends
        socket.on('song_ended', () => {
            const newSong = playlistManager.nextSong();
            if (newSong) {
                io.emit('play_next', newSong);
            }
            io.emit('update_queue', playlistManager.getQueue());
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
}

module.exports = {
    initialize,
};