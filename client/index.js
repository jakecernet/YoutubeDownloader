const outputDiv = document.querySelector('.output');
const audioMessageElement = document.getElementById('audioMessage');
const audioLinkElement = document.getElementById('audioLink');
const videoMessageElement = document.getElementById('videoMessage');
const videoLinkElement = document.getElementById('videoLink');
const videoThumbnailElement = document.getElementById('videoThumbnail')

// Hide the output div initially
outputDiv.style.display = 'none';

//hide download links initially
audioLinkElement.style.display = videoLinkElement.style.display = 'none';

form = document.getElementById('downloadForm');
form.addEventListener('submit', function (event) {
    event.preventDefault();
});

function downloadAudio() {
    const urlInput = document.getElementById('urlInput').value;

    //display loading message
    audioMessageElement.innerHTML = '<p>Downloading audio...</p>';

    fetch(`/download/audio?url=${encodeURIComponent(urlInput)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response;
        })
        .then(response => response.blob())
        .then(blob => {
            // Create a Blob URL for the blob data
            const blobUrl = URL.createObjectURL(blob);

            // Set the download link attributes based on the file type
            if (blob.type.startsWith('audio')) {
                audioLinkElement.href = blobUrl;
                audioLinkElement.download = `${urlInput.split('v=')[1]}.mp3`;
                audioLinkElement.style.display = 'flex';

                // Load audio thumbnail
                const thumbnailUrl = `https://img.youtube.com/vi/${urlInput.split('v=')[1]}/maxresdefault.jpg`;
                videoThumbnailElement.src = thumbnailUrl;

                // Show the output div when audio is downloaded
                outputDiv.style.display = 'flex';
            }

            // Display success message
            audioMessageElement.innerHTML = '<p>Audio downloaded successfully.</p>';
        })
        .catch(error => {
            console.error('Error:', error);

            // Display error message
            audioMessageElement.innerHTML = '<p>An error occurred while downloading the audio. Please try again.</p>';

            // Hide download links and thumbnail in case of an error
            audioLinkElement.style.display = 'none';

            // Show the output div even on error
            outputDiv.style.display = 'flex';
        });

    // Scroll to the output div
    outputDiv.scrollIntoView({ behavior: 'smooth' });
}

function downloadVideo() {
    const urlInput = document.getElementById('urlInput').value;

    //display loading message
    videoMessageElement.innerHTML = '<p>Downloading video...</p>';

    fetch(`/download?url=${encodeURIComponent(urlInput)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response;
        })
        .then(response => response.blob())
        .then(blob => {
            // Create a Blob URL for the blob data
            const blobUrl = URL.createObjectURL(blob);

            // Set the download link attributes based on the file type
            if (blob.type.startsWith('video')) {
                videoLinkElement.href = blobUrl;
                videoLinkElement.download = `${urlInput.split('v=')[1]}.mp4`;
                videoLinkElement.style.display = 'flex';
                // Load video thumbnail
                const thumbnailUrl = `https://img.youtube.com/vi/${urlInput.split('v=')[1]}/maxresdefault.jpg`;
                videoThumbnailElement.src = thumbnailUrl;

                // Show the output div when video is downloaded
                outputDiv.style.display = 'flex';
            } else if (blob.type.startsWith('audio')) {
                audioLinkElement.href = blobUrl;
                audioLinkElement.download = `${urlInput.split('v=')[1]}.mp3`;
                audioLinkElement.style.display = 'flex';

                // Show the output div when audio is downloaded
                outputDiv.style.display = 'flex';
            }

            // Display success message
            videoMessageElement.innerHTML = '<p>Video downloaded successfully.</p>';
        })
        .catch(error => {
            console.error('Error:', error);

            // Display error message
            videoMessageElement.innerHTML = '<p>An error occurred while downloading the video. Please try again.</p>';

            // Hide download links and thumbnail in case of an error
            videoLinkElement.style.display = audioLinkElement.style.display = 'none';
            videoThumbnailElement.src = '';

            // Show the output div even on error
            outputDiv.style.display = 'flex';
        });

    // Scroll to the output div
    outputDiv.scrollIntoView({ behavior: 'smooth' });
}
