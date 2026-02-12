const axios = require('axios');
const yts = require('yt-search');

/**
 * Checks if a string is a valid URL.
 * @param {string} string - The string to check.
 * @returns {boolean} - True if the string is a URL, false otherwise.
 */
function isUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * Extracts the YouTube video ID from a URL.
 * @param {string} url - The YouTube URL.
 * @returns {string|false} - The video ID, or false if not found.
 */
function getYouTubeID(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : false;
}

/**
 * Fetches metadata for a YouTube video from its ID.
 * @param {string} videoId - The YouTube video ID.
 * @returns {Promise<Object>} - The video metadata (title, artist).
 */
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

/**
 * Searches for a song on YouTube using a query.
 * @param {string} query - The search query.
 * @returns {Promise<Object|null>} - The search result (id, title, artist), or null if not found.
 */
async function searchSong(query) {
    try {
        const r = await yts(query);
        const videos = r.videos;
        
        if (videos.length > 0) {
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

module.exports = {
    isUrl,
    getYouTubeID,
    getYoutubeMetadata,
    searchSong,
};