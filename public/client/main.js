const socket = io();

// Get input element
const inputField = document.getElementById("linkInput");

// Add event listener for Enter key
inputField.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault(); 
        requestSong();
    }
});

/**
 * Sends a song request to the server.
 * It takes the value from the input field, emits a 'request_song' event to the server,
 * and provides visual feedback to the user.
 */
function requestSong() {
    const input = document.getElementById('linkInput');
    if (input.value) {
        // Visual feedback for the button
        const btn = document.querySelector('button');
        const originalText = btn.innerText;
        btn.innerText = "Sent!";
        btn.classList.add('bg-ctp-green', 'text-ctp-base');
        btn.classList.remove('bg-ctp-blue');
        
        setTimeout(() => {
            btn.innerText = originalText;
            btn.classList.remove('bg-ctp-green', 'text-ctp-base');
            btn.classList.add('bg-ctp-blue');
        }, 1000);

        socket.emit('request_song', input.value);
        input.value = ''; 
    }
}

// Listen for 'update_queue' events from the server
socket.on('update_queue', (data) => {
    // Update the "Now Playing" section
    const npContainer = document.getElementById('nowPlayingContainer');
    if (data.currentSong) {
        npContainer.classList.remove('animate-pulse');
        document.getElementById('nowPlaying').innerHTML = `
            <div class="font-bold text-lg leading-tight line-clamp-1">${data.currentSong.title}</div>
            <div class="text-sm text-ctp-subtext0 flex items-center gap-1">
                <span>👤 ${data.currentSong.artist}</span>
            </div>
        `;
    } else {
        npContainer.classList.add('animate-pulse');
        document.getElementById('nowPlaying').innerHTML = `<span class="text-ctp-subtext0 italic">Silence... No songs yet.</span>`;
    }

    // Update the queue list
    const list = document.getElementById('queueList');
    list.innerHTML = "";

    if (data.playlist.length === 0) {
        list.innerHTML = `<li class="text-center text-ctp-surface1 py-8 text-sm">Queue is empty. Be the first!</li>`;
    } else {
        data.playlist.forEach((song, index) => {
            const li = document.createElement('li');
            li.className = "bg-ctp-surface0/40 hover:bg-ctp-surface0 transition-colors p-3 rounded-lg flex items-start gap-3 border border-transparent hover:border-ctp-surface1";
            li.innerHTML = `
                <div class="text-ctp-overlay0 font-mono text-sm mt-1">#${index + 1}</div>
                <div class="overflow-hidden">
                    <div class="font-semibold text-ctp-text truncate">${song.title}</div>
                    <div class="text-xs text-ctp-subtext0 truncate">👤 ${song.artist}</div>
                </div>
            `;
            list.appendChild(li);
        });
    }
});