# 🎵 HIMA Jukebox System

A modern, real-time collaborative music queue system built with Node.js, Socket.io, and Tailwind CSS (Catppuccin Mocha theme).

Designed for shared spaces (like secretariats, offices, or parties) where one "Host" device plays music, and anyone on the same network can request songs via their phone or laptop.

## ✨ Features

- **Real-time Queue:** Songs added by users appear instantly on the host and other clients.
- **YouTube Integration:** Supports YouTube links and keyword searches.
- **Modern UI:** Beautiful dark mode interface using the Catppuccin Mocha palette.
- **Host Dashboard:** Dedicated admin view with player controls (Play, Pause, Skip) and status monitoring.
- **Auto-Play:** Automatically plays the next song in the queue when the current one ends.

## 🛠️ Prerequisites

- **Node.js** (v14 or higher) installed on your system.

## 🚀 Installation

1.  **Clone the repository** (or download the source code):
    ```bash
    git clone https://github.com/farreru/hima-jukebox.git
    cd hima-jukebox
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## ▶️ Usage

### 1. Start the Server
Run the following command in your terminal:
```bash
npm start
# OR
node server.js
```
The server will start at `http://localhost:3000`.

### 2. Setup the Host (Audio Player)
*   Open a browser on the computer connected to the speakers.
*   Go to: `http://localhost:3000/host.html`
*   **Important:** Click the large **"INITIALIZE SYSTEM"** button to enable audio (due to browser autoplay policies).
*   Leave this tab open. This device will handle the audio playback.

### 3. Make Requests (Clients)
*   Open a browser on any device (phone, laptop) connected to the same Wi-Fi.
*   Go to: `http://<YOUR_IP_ADDRESS>:3000` (e.g., `http://192.168.1.5:3000`) or `http://localhost:3000` if on the same machine.
*   Paste a **YouTube Link** or type a **Song Title** in the search box.
*   Click **"Kirim"** to add it to the queue.

## 📁 Project Structure

*   `server.js`: Main backend logic (Express + Socket.io).
*   `public/index.html`: Client interface for requesting songs.
*   `public/host.html`: Host interface for playing music.

## 🎨 Theme

The UI uses **Tailwind CSS** with the [Catppuccin Mocha](https://github.com/catppuccin/catppuccin) color scheme for a soothing, high-contrast dark mode experience.

## 📝 License

This project is open-source and available for personal or educational use.
