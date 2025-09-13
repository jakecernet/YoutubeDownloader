# YoutubeDownloader

## Description

This is a simple YouTube downloader. It can download videos only from YouTube.

# !!! Disclaimer !!!

You can only download videos that are smaller than 6 MB. That's because of the Vercel's serverless functions limit. If you want to download bigger videos, you can follow the instructions below to host the project on your own server or computer or use my python YouTube downloader [here](https://github.com/jakecernet/YT_Downloader).

## Usage

1. Copy the link of the video you want to download from the address bar of your browser or else it won't work.
2. Paste the link in the input field.
3. Click on the download button.
4. Wait for the download to finish, don't paste another link until the download is finished.
5. When the download is finished, you can either download the video or the audio file.

## Local installation

1. Clone the repository.
2. Run the command `npm install` in the root directory.
3. Run the command `npm run dev` to start the development server.
4. Open `localhost:3000` in your browser.
5. You can use it like the online version, the only difference is that you can download bigger videos.

## How it works

The project is built using Express.js and NodeJS.
It works bi utilizing the [ytdl-core](https://www.npmjs.com/package/ytdl-core) package, using which it downloads the video and audio files from YouTube.
It then saves the downloaded file to cache using the `blob` object and then creates a download link for the user to download the file.

## Improvements (Dark Theme Redesign)

-   Modern dark UI with accessible contrast & focus states
-   Unified fetch logic, added `/api/info` endpoint for title/thumbnail prefetch
-   Reduced duplicate server code via helpers (`getVideoInfo`, `streamSelected`)
-   Basic validation of YouTube URLs before attempting download
-   Lightweight status feedback & loading indicator on client
-   Removed extraneous footer text; simplified layout structure
-   Added small security headers and caching for static assets
-   Progressive enhancement: info auto-fetch on blur when URL valid
