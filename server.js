const express = require("express");
const path = require("path");
const ytdl = require("ytdl-core");

const app = express();
const port = process.env.PORT || 3000;

// Basic security / cache headers (small scope)
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "public, max-age=300"); // cache static for 5m
    next();
});

app.use(express.static(path.join(__dirname, "client"), { maxAge: "5m" }));

app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "client", "index.html"));
});

// Helper: validate & fetch info
async function getVideoInfo(url) {
    if (!url) {
        const err = new Error("Missing URL parameter");
        err.statusCode = 400;
        throw err;
    }
    if (!ytdl.validateURL(url)) {
        const err = new Error("Invalid YouTube URL");
        err.statusCode = 400;
        throw err;
    }
    return ytdl.getInfo(url);
}

function sanitizeTitle(title) {
    return title.replace(/[^\w\s.-]/g, "").trim() || "video";
}

function streamSelected(res, url, info, filter, kindLabel) {
    const formats = ytdl.filterFormats(info.formats, filter);
    if (!formats.length) {
        const err = new Error(`No ${kindLabel} formats available`);
        err.statusCode = 400;
        throw err;
    }
    const selected = formats[0];
    const safeTitle = sanitizeTitle(info.videoDetails.title);
    if (!res.headersSent) {
        res.setHeader(
            "Content-Type",
            selected.mimeType || "application/octet-stream"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${safeTitle}.${selected.container || "bin"}"`
        );
    }
    return ytdl(url, { format: selected });
}

// Info endpoint for client optimization (title/thumbnail)
app.get("/api/info", async (req, res) => {
    try {
        const { url } = req.query;
        const info = await getVideoInfo(url);
        const { title, videoId, lengthSeconds, thumbnails } = info.videoDetails;
        res.json({
            title,
            videoId,
            lengthSeconds: Number(lengthSeconds),
            thumbnail:
                thumbnails?.[thumbnails.length - 1]?.url ||
                `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        });
    } catch (e) {
        res.status(e.statusCode || 500).json({
            error: e.message || "Error fetching info",
        });
    }
});

app.get("/download", async (req, res) => {
	try {
		const { url } = req.query;
		const info = await getVideoInfo(url);

		// Prefer progressive (video+audio) formats, highest resolution
		let progressive = info.formats.filter(f => f.hasVideo && f.hasAudio);
		// Prefer mp4 if available
		const mp4Progressive = progressive.filter(f => f.container === "mp4");
		if (mp4Progressive.length) progressive = mp4Progressive;

		progressive.sort((a, b) =>
			(b.height || 0) - (a.height || 0) ||
			(b.bitrate || 0) - (a.bitrate || 0)
		);

		let selected = progressive[0];

		// Fallback: any highest format (may be video-only)
		if (!selected) {
			selected = ytdl.chooseFormat(info.formats, { quality: "highest" });
		}
		if (!selected) {
			return res.status(400).json({ error: "No suitable format found" });
		}

		const safeTitle = sanitizeTitle(info.videoDetails.title);
		if (!res.headersSent) {
			res.setHeader("Content-Type", selected.mimeType || "application/octet-stream");
			res.setHeader(
				"Content-Disposition",
				`attachment; filename="${safeTitle}.${selected.container || "bin"}"`
			);
		}

		const stream = ytdl(url, { format: selected });
		stream.on("error", (err) => {
			if (!res.headersSent) res.status(500);
			res.end();
			console.error("Stream error (video max quality):", err.message);
		});
		stream.pipe(res);
	} catch (e) {
		console.error("Download error (max quality):", e);
		res.status(e.statusCode || 500).json({
			error: e.message || "Download failed",
		});
	}
});

app.get("/download/audio", async (req, res) => {
    try {
        const { url } = req.query;
        const info = await getVideoInfo(url);
        const stream = streamSelected(res, url, info, "audioonly", "audio");
        stream.on("error", (err) => {
            if (!res.headersSent) res.status(500);
            res.end();
            console.error("Stream error (audio):", err.message);
        });
        stream.pipe(res);
    } catch (e) {
        console.error("Audio download error:", e);
        res.status(e.statusCode || 500).json({
            error: e.message || "Audio download failed",
        });
    }
});

app.listen(port, () => {
    console.log(`Server running: http://localhost:${port}`);
});

module.exports = app;
