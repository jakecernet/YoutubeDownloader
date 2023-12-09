const express = require('express');
const path = require('path');
const ytdl = require('ytdl-core');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'client')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.get('/download', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'Missing URL parameter', message: 'Please enter a YouTube URL.' });
    }

    const info = await ytdl.getInfo(url);

    // Get the formats with both video and audio
    const videoAudioFormats = ytdl.filterFormats(info.formats, 'videoandaudio');

    if (!videoAudioFormats.length) {
      return res.status(400).json({ error: 'No available formats for the provided URL', message: 'Video format not available for the provided URL.' });
    }

    // Choose the first format that includes both video and audio
    const selectedFormat = videoAudioFormats[0];

    const videoStream = ytdl(url, { format: selectedFormat });

    // Sanitize the video title for the Content-Disposition header
    const sanitizedTitle = info.videoDetails.title.replace(/[^\w\s.-]/g, ''); // Remove invalid characters

    // Set headers only if the response has not been sent yet.
    if (!res.headersSent) {
      res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}.${selectedFormat.container}"`);
      res.setHeader('Content-Type', selectedFormat.mimeType);
    }

    // Pipe the video stream to the response
    videoStream.pipe(res);

    // Inform the client that the download is successful
    res.on('finish', () => {
      // Send a success message if needed
      console.log('Download finished successfully');
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error', message: 'Internal server error occurred.', details: error.message });
  }
});

// Add a separate route for downloading audio
const ffmpeg = require('fluent-ffmpeg');

app.get('/download/audio', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'Missing URL parameter', message: 'Please enter a YouTube URL.' });
    }

    const info = await ytdl.getInfo(url);

    // Get the formats with audio only
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

    if (!audioFormats.length) {
      return res.status(400).json({ error: 'No available audio formats for the provided URL', message: 'Audio format not available for the provided URL.' });
    }

    // Choose the first format that includes audio only
    const selectedFormat = audioFormats[0];

    const audioStream = ytdl(url, { format: selectedFormat });

    // Sanitize the video title for the Content-Disposition header
    const sanitizedTitle = info.videoDetails.title.replace(/[^\w\s.-]/g, ''); // Remove invalid characters

    // Set headers
    res.attachment(`${sanitizedTitle}.${selectedFormat.container}`);
    res.setHeader('Content-Type', selectedFormat.mimeType);

    // Pipe the audio stream directly to the response
    audioStream.pipe(res);

    // Inform the client that the download is successful
    res.on('finish', () => {
      // Send a success message if needed
      console.log('Download finished successfully');
    });

  } catch (error) {
    console.error('Error during audio download:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Internal server error occurred during audio download.', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

module.exports = app;