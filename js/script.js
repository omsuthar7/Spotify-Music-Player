// A console log to confirm the script is running successfully
console.log('JavaScript is ready to rock!');

// =============================================
// |            Global Variables               |
// =============================================

// The main Audio object for the currently playing song
let currentSong = new Audio();
// An array to hold the list of songs for the current playlist
let songList;
// A string to store the path of the current folder/album being played
let currentAlbumFolder;


// =============================================
// |            Utility Functions              |
// =============================================

/**
 * Converts seconds into a "minutes:seconds" format (e.g., 03:21).
 * @param {number} seconds - The total seconds to format.
 * @returns {string} The formatted time string "mm:ss".
 */
function formatTime(seconds) {
    // Return "00:00" if the input is not a valid number or is negative
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    // Calculate minutes and remaining seconds
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    // Pad with a leading zero if necessary to ensure two digits
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    // Return the final formatted string
    return `${formattedMinutes}:${formattedSeconds}`;
}


// =============================================
// |      Core Music & Album Functions         |
// =============================================

/**
 * Fetches and displays the list of songs from a specified folder.
 * @param {string} folderPath - The path to the folder containing the songs.
 * @returns {Promise<string[]>} A promise that resolves to an array of song filenames.
 */
async function getAndDisplaySongs(folderPath) {
    currentAlbumFolder = folderPath;
    // Fetch the directory listing from the server
    let response = await fetch(`/${folderPath}/`);
    let htmlContent = await response.text();

    // Create a temporary div to parse the HTML response
    let tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    // Get all anchor tags (links) from the parsed HTML
    let anchorTags = tempDiv.getElementsByTagName("a");
    songList = []; // Reset the global songs array

    // Loop through the anchor tags to find .mp3 files
    for (const anchor of anchorTags) {
        if (anchor.href.endsWith(".mp3")) {
            // Extract the filename from the URL and add it to the songs array
            songList.push(anchor.href.split(`/${folderPath}/`)[1]);
        }
    }

    // --- Display the fetched songs in the "Your Library" list ---
    let songListContainer = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songListContainer.innerHTML = ""; // Clear the previous song list

    // Create and append a list item for each song
    for (const song of songList) {
        songListContainer.innerHTML += `<li>
            <img class="invert" width="34" src="img/music.svg" alt="Music Icon">
            <div class="info">
                <div>${song.replaceAll("%20", " ")}</div>
                <div>Artist Name</div> <!-- Placeholder for artist name -->
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="img/play.svg" alt="Play Icon">
            </div>
        </li>`;
    }

    // --- Attach a click event listener to each song in the list ---
    const songListItems = document.querySelector(".songList").getElementsByTagName("li");
    Array.from(songListItems).forEach(listItem => {
        listItem.addEventListener("click", () => {
            // Get the song name from the list item and play it
            const songName = listItem.querySelector(".info").firstElementChild.innerHTML.trim();
            playMusic(songName);
        });
    });

    return songList;
}

/**
 * Loads and plays a music track.
 * @param {string} trackName - The filename of the song to play.
 * @param {boolean} [isPaused=false] - If true, the song will be loaded but not played immediately.
 */
const playMusic = (trackName, isPaused = false) => {
    // Set the source of the Audio object using the current album folder
    currentSong.src = `/${currentAlbumFolder}/` + trackName;

    if (!isPaused) {
        currentSong.play();
        // Change the main play button icon to the pause icon
        document.getElementById("play").src = "img/pause.svg";
    }

    // Update the song information and time display in the playbar
    document.querySelector(".songinfo").innerHTML = decodeURI(trackName);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};


/**
 * Fetches and displays all available albums/playlists as cards on the main page.
 */
async function displayAlbums() {
    console.log("Fetching and displaying albums...");
    // Fetch the list of folders inside the 'songs' directory
    let response = await fetch(`/songs/`);
    let htmlContent = await response.text();
    let tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    let allAnchors = tempDiv.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");

    for (const anchor of allAnchors) {
        // Check if the link points to a song folder
        if (anchor.href.includes("/songs/") && !anchor.href.includes(".htaccess")) {
            // Extract the folder name from the URL
            const folderName = anchor.href.split("/").slice(-2)[0];

            // Fetch the metadata (info.json) for that folder
            let metadataResponse = await fetch(`/songs/${folderName}/info.json`);
            let metadata = await metadataResponse.json();

            // Create and append the album card to the container
            cardContainer.innerHTML += `
                <div data-folder="${folderName}" class="card">
                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="/songs/${folderName}/cover.jpg" alt="${metadata.title} Album Cover">
                    <h2>${metadata.title}</h2>
                    <p>${metadata.description}</p>
                </div>`;
        }
    }

    // --- Add a click event listener to each album card ---
    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async (event) => {
            const folderName = event.currentTarget.dataset.folder;
            console.log(`Fetching songs for album: ${folderName}`);
            // Load the songs from the clicked album
            const songs = await getAndDisplaySongs(`songs/${folderName}`);
            // Automatically play the first song of the album if available
            if (songs && songs.length > 0) {
                playMusic(songs[0]);
            }
        });
    });
}


// =============================================
// |           Main Execution Function         |
// =============================================

/**
 * The main function to initialize the application and set up all event listeners.
 */
async function initializeApp() {

    // --- 1. Initial Setup ---
    // Load songs from a default folder on startup
    await getAndDisplaySongs("songs/ncs");
    // Load the first song but keep it paused initially
    if (songList && songList.length > 0) {
        playMusic(songList[0], true);
    }

    // Fetch and display all albums on the page
    await displayAlbums();


    // --- 2. Playback Control Event Listeners ---
    // Event listener for the main Play/Pause button
    document.getElementById("play").addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            document.getElementById("play").src = "img/pause.svg";
        } else {
            currentSong.pause();
            document.getElementById("play").src = "img/play.svg";
        }
    });

    // Event listener for the Next button
    document.getElementById("next").addEventListener("click", () => {
        console.log("Next button clicked");
        // Find the index of the current song in the playlist
        const currentIndex = songList.indexOf(currentSong.src.split("/").slice(-1)[0]);
        // Play the next song if it's not the last one
        if ((currentIndex + 1) < songList.length) {
            playMusic(songList[currentIndex + 1]);
        }
    });

    // Event listener for the Previous button
    document.getElementById("previous").addEventListener("click", () => {
        console.log("Previous button clicked");
        // Find the index of the current song
        const currentIndex = songList.indexOf(currentSong.src.split("/").slice(-1)[0]);
        // Play the previous song if it's not the first one
        if ((currentIndex - 1) >= 0) {
            playMusic(songList[currentIndex - 1]);
        }
    });


    // --- 3. Seek Bar and Time Display Logic ---
    // Listen for the 'timeupdate' event to update the UI in real-time
    currentSong.addEventListener("timeupdate", () => {
        // Update the song time display (e.g., "01:23 / 03:45")
        document.querySelector(".songtime").innerHTML =
            `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;
        // Update the position of the circle on the seekbar
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Add a click event listener to the seekbar for song seeking
    document.querySelector(".seekbar").addEventListener("click", event => {
        // Calculate the clicked position as a percentage of the seekbar's width
        let percent = (event.offsetX / event.target.getBoundingClientRect().width) * 100;
        // Update the circle's visual position
        document.querySelector(".circle").style.left = percent + "%";
        // Update the song's current playback time
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });


    // --- 4. UI Interactivity (Mobile Hamburger Menu) ---
    // Event listener to open the left menu on hamburger icon click
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // Event listener to close the left menu via the close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });


    // --- 5. Volume Control Logic ---
    // Event listener for the volume control slider
    document.querySelector(".range input").addEventListener("change", (event) => {
        const volumeValue = parseInt(event.target.value);
        console.log(`Setting volume to ${volumeValue}%`);
        currentSong.volume = volumeValue / 100;

        // Update volume icon based on volume level
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = "img/volume.svg";
        } else {
            document.querySelector(".volume>img").src = "img/mute.svg";
        }
    });

    // Event listener for the volume icon to mute/unmute the audio
    document.querySelector(".volume>img").addEventListener("click", event => {
        const volumeIcon = event.target;
        const volumeSlider = document.querySelector(".range input");

        // If currently not muted, mute it
        if (volumeIcon.src.includes("volume.svg")) {
            volumeIcon.src = "img/mute.svg";
            currentSong.volume = 0;
            volumeSlider.value = 0;
        }
        // If currently muted, unmute it to a default volume
        else {
            volumeIcon.src = "img/volume.svg";
            currentSong.volume = 0.10; // Default unmute volume (10%)
            volumeSlider.value = 10;
        }
    });
}

// Start the application by calling the main initialization function
initializeApp();
