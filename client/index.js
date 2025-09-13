// New UI references
const form = document.getElementById("downloadForm");
const urlInput = document.getElementById("urlInput");
const infoBtn = document.getElementById("infoBtn");
const videoBtn = document.getElementById("videoBtn");
const audioBtn = document.getElementById("audioBtn");
const inlineStatus = document.getElementById("inlineStatus");
const resultSection = document.getElementById("result");
const videoThumbnailElement = document.getElementById("videoThumbnail");
const videoTitleElement = document.getElementById("videoTitle");
const videoLinkElement = document.getElementById("videoLink");
const audioLinkElement = document.getElementById("audioLink");

function setStatus(msg, state = "idle") {
    inlineStatus.textContent = msg || "";
    inlineStatus.classList.remove("loading");
    if (state === "loading") inlineStatus.classList.add("loading");
}

function parseVideoId(url) {
    try {
        const u = new URL(url.trim());
        if (u.hostname.includes("youtube.") || u.hostname === "youtu.be") {
            if (u.hostname === "youtu.be") return u.pathname.slice(1);
            return u.searchParams.get("v");
        }
    } catch (_) {
        /* ignore */
    }
    return null;
}

async function fetchInfo() {
    const raw = urlInput.value.trim();
    if (!raw) return setStatus("Enter a YouTube URL");
    setStatus("Fetching info…", "loading");
    try {
        const r = await fetch(`/api/info?url=${encodeURIComponent(raw)}`);
        if (!r.ok) throw new Error("Info fetch failed");
        const data = await r.json();
        const vid = data.videoId || parseVideoId(raw);
        const thumb =
            data.thumbnail ||
            (vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : "");
        videoThumbnailElement.src = thumb;
        videoTitleElement.textContent = data.title || "Untitled";
        resultSection.hidden = false;
        setStatus("Info loaded");
    } catch (e) {
        console.error(e);
        setStatus("Could not fetch info");
    }
}

async function download(kind) {
    const raw = urlInput.value.trim();
    if (!raw) return setStatus("Enter a YouTube URL");
    const endpoint = kind === "audio" ? "/download/audio" : "/download";
    setStatus(`Downloading ${kind}…`, "loading");
    try {
        const res = await fetch(`${endpoint}?url=${encodeURIComponent(raw)}`);
        if (!res.ok) {
            const maybeJson = await res
                .clone()
                .text()
                .catch(() => "");
            throw new Error(`Failed (${res.status}) ${maybeJson}`);
        }
        const blob = await res.blob();
        const id = parseVideoId(raw) || "video";
        const ext = blob.type.startsWith("audio")
            ? "mp3"
            : blob.type.includes("mp4")
            ? "mp4"
            : "dat";
        const blobUrl = URL.createObjectURL(blob);
        if (blob.type.startsWith("audio")) {
            audioLinkElement.href = blobUrl;
            audioLinkElement.download = `${id}.${ext}`;
            audioLinkElement.hidden = false;
        } else {
            videoLinkElement.href = blobUrl;
            videoLinkElement.download = `${id}.${ext}`;
            videoLinkElement.hidden = false;
        }
        // Ensure info visible
        if (videoThumbnailElement.src === "" && id) {
            videoThumbnailElement.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
        }
        resultSection.hidden = false;
        setStatus(
            `${kind.charAt(0).toUpperCase() + kind.slice(1)} ready. Click save.`
        );
    } catch (e) {
        console.error(e);
        setStatus(`Error: ${e.message}`);
    }
}

form.addEventListener("submit", (e) => e.preventDefault());
infoBtn.addEventListener("click", () => fetchInfo());
videoBtn.addEventListener("click", () => download("video"));
audioBtn.addEventListener("click", () => download("audio"));

// Quick paste focus improvement
window.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== urlInput) {
        urlInput.focus();
        e.preventDefault();
    }
});

// If user already pasted a full link and leaves focus, prefetch info
urlInput.addEventListener("blur", () => {
    if (parseVideoId(urlInput.value)) fetchInfo();
});

// Accessibility: announce after load
window.addEventListener("load", () => setStatus("Ready"));
