/**
 * In-memory store for the playlist and current song.
 */
let playlist = [];
let currentSong = null;

/**
 * Returns the current playlist and song.
 * @returns {{playlist: Array, currentSong: Object}}
 */
function getQueue() {
    return { playlist, currentSong };
}

/**
 * Adds a song to the playlist if it's not already there.
 * @param {Object} songData - The song to add.
 * @returns {boolean} - True if the song was added, false otherwise.
 */
function addSong(songData) {
    const exists = playlist.some(s => s.id === songData.id) || (currentSong && currentSong.id === songData.id);
    if (!exists) {
        playlist.push(songData);
        console.log(`Adding: ${songData.title}`);
        return true;
    }
    return false;
}

/**
 * Removes a song from the playlist at a specific index.
 * @param {number} index - The index of the song to remove.
 * @returns {Object|null} - The removed song, or null if the index is invalid.
 */
function removeSong(index) {
    if (typeof index === 'number' && index >= 0 && index < playlist.length) {
        const removed = playlist.splice(index, 1);
        console.log(`Removed from queue: ${removed[0].title}`);
        return removed[0];
    }
    return null;
}

/**
 * Moves the next song in the playlist to be the current song.
 * @returns {Object|null} - The new current song, or null if the playlist is empty.
 */
function nextSong() {
    if (playlist.length > 0) {
        currentSong = playlist.shift();
    } else {
        currentSong = null;
    }
    return currentSong;
}

module.exports = {
    getQueue,
    addSong,
    removeSong,
    nextSong,
};