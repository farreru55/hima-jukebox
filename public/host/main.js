const socket = io();
let player;
let isReady = false;

// 1. Load IFrame API YouTube
var tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

/**
 * This function creates an <iframe> (and YouTube player)
 * after the API code downloads.
 */
function onYouTubeIframeAPIReady() {
    player = new YT.Player("player", {
        height: "100%",
        width: "100%",
        playerVars: {
            controls: 1, // Show controls
            disablekb: 0, // Enable keyboard
            fs: 1, // Enable fullscreen
            rel: 0, // Disable related videos at end
            origin: window.location.origin,
        },
        events: {
            onStateChange: onPlayerStateChange,
            onReady: onPlayerReady,
        },
    });
}

/**
 * The API will call this function when the video player is ready.
 * @param {Object} event - The event object.
 */
function onPlayerReady(event) {
    console.log("Player API Ready");
}

/**
 * The API calls this function when the player's state changes.
 * @param {Object} event - The event object.
 */
function onPlayerStateChange(event) {
    // State 0 means ENDED
    if (event.data === 0) {
        console.log("Song ended, requesting next...");
        setStatus("ENDING_TRACK", "text-ctp-red");
        socket.emit("song_ended");
        document.getElementById("idleState").style.display = "flex";
    } else if (event.data === 1) {
        // Playing
        setStatus("PLAYING", "text-ctp-green");
        document.getElementById("idleState").style.display = "none";
    } else if (event.data === 2) {
        // Paused
        setStatus("PAUSED", "text-ctp-peach");
    }
}

/**
 * This function is called when the user clicks the "INITIALIZE SYSTEM" button.
 * It's a workaround for browser autoplay policies.
 */
function startSystem() {
    isReady = true;
    socket.emit("song_ended"); // Trigger server to send first song

    // UI Updates
    const overlay = document.getElementById("startOverlay");
    overlay.style.opacity = "0";
    setTimeout(() => {
        overlay.style.display = "none";
    }, 500);

    setStatus("ACTIVE - WAITING", "text-ctp-blue");
}

/**
 * Updates the status text and color.
 * @param {string} text - The text to display.
 * @param {string} colorClass - The Tailwind CSS color class.
 */
function setStatus(text, colorClass) {
    const el = document.getElementById("statusText");
    el.innerText = text;
    el.className = `font-bold ${colorClass}`;
}

/**
 * Skips the current song.
 */
function skipSong() {
    if (isReady) {
        console.log("Skipping song...");
        setStatus("SKIPPING...", "text-ctp-red");

        // Stop player to avoid audio overlap
        if (player && player.stopVideo) {
            player.stopVideo();
        }

        // Force server to send next song
        socket.emit("song_ended");
    }
}

/**
 * Removes a song from the queue.
 * @param {number} index - The index of the song to remove.
 */
function removeSong(index) {
    socket.emit("remove_from_queue", index);
}

/**
 * Moves a song up in the queue.
 * @param {number} index - The current index of the song to move.
 */
function moveSongUp(index) {
    if (index > 0) {
        socket.emit("reorder_queue", { oldIndex: index, newIndex: index - 1 });
    }
}

/**
 * Moves a song down in the queue.
 * @param {number} index - The current index of the song to move.
 */
function moveSongDown(index) {
    // The server will handle bounds checking based on the actual playlist state.
    socket.emit("reorder_queue", { oldIndex: index, newIndex: index + 1 });
}


// Listen for 'play_next' events from the server
socket.on("play_next", (song) => {
    if (song && isReady) {
        console.log("Playing:", song.title);

        // Update UI Info
        document.getElementById("currentInfo").innerText = song.title;
        document.getElementById("currentArtist").innerText = song.artist || "Unknown Artist";

        // Ensure player exists
        if (player && player.loadVideoById) {
            player.loadVideoById(song.id);
        }
    }
});

// Listen for 'update_queue' events from the server
socket.on("update_queue", ({ playlist }) => {
    const queueList = document.getElementById("queueList");
    if (!playlist || playlist.length === 0) {
        queueList.innerHTML = `
            <div class="text-ctp-subtext0 text-[10px] italic p-2 text-center">
                QUEUE IS EMPTY
            </div>
        `;
        return;
    }

    queueList.innerHTML = playlist
        .map(
            (song, index) => `
                <div class="bg-ctp-surface0/30 p-2 rounded border border-ctp-surface1/50 flex items-center gap-2 group hover:bg-ctp-surface0/60 transition-colors">
                    <div class="flex items-start gap-2 flex-1 min-w-0">
                        <span class="text-ctp-surface2 text-[9px] font-bold mt-0.5">${index + 1}</span>
                        <div class="flex-1 min-w-0 flex flex-col gap-0.5">
                            <div class="text-ctp-blue text-[11px] font-bold truncate leading-tight group-hover:text-ctp-peach transition-colors">
                                ${song.title}
                            </div>
                            <div class="text-ctp-subtext0 text-[9px] truncate">
                                ${song.artist || "Unknown Artist"}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-1">
                        <button
                            onclick="moveSongUp(${index})"
                            class="text-ctp-surface2 hover:text-ctp-mauve transition-colors p-1 rounded hover:bg-ctp-surface1/50 ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}"
                            title="Move Up"
                            ${index === 0 ? 'disabled' : ''}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 10.828l-4.95 4.95-1.414-1.414L12 8l6.364 6.364-1.414 1.414z"/>
                            </svg>
                        </button>
                        <button
                            onclick="moveSongDown(${index})"
                            class="text-ctp-surface2 hover:text-ctp-mauve transition-colors p-1 rounded hover:bg-ctp-surface1/50 ${index === playlist.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}"
                            title="Move Down"
                            ${index === playlist.length - 1 ? 'disabled' : ''}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 13.172l4.95-4.95 1.414 1.414L12 16l-6.364-6.364 1.414-1.414z"/>
                            </svg>
                        </button>
                        <button
                            onclick="removeSong(${index})"
                            class="text-ctp-surface2 hover:text-ctp-red transition-colors p-1 rounded hover:bg-ctp-surface1/50"
                            title="Remove from Queue"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.49 1.478l-.565 9.064a2.535 2.535 0 01-.658 1.447c-.63.63-1.46.994-2.35.994h-6.63c-.89 0-1.72-.364-2.35-.994a2.535 2.535 0 01-.658-1.447l-.565-9.064a48.892 48.892 0 01-3.388-.42.75.75 0 01.49-1.478 47.36 47.36 0 013.878-.512v-.227c0-1.106.848-2.026 1.94-2.137.668-.069 1.343-.105 2.02-.105a46.604 46.604 0 012.02.105c1.092.111 1.94 1.031 1.94 2.137z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            `,
                )
                .join("");
        });
