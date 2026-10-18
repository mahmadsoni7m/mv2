# SONI MOTION STUDIO
Create. Animate. Feel the Beat. A static, no-backend web app: pick a procedural background (or upload an image), combine animation effects, add your own music, preview live, and record a real video in the browser.
## Run / deploy
Open `index.html` through any static host. GitHub Pages: upload all files to a repo, then Settings → Pages → deploy from branch `main`, folder `/ (root)`. Open the published `https://<user>.github.io/<repo>/` URL in Chrome on Android. All paths are relative.
## Export honesty
- Export uses `canvas.captureStream` + `MediaRecorder`, recorded in real time (a 30 s video takes ~30 s). Output is **MP4 (H.264/AAC) when the browser records it natively (recent Chrome on Android), otherwise WebM**; WebM was the only option before. Previously: **WebM** (VP9/VP8 + Opus) when supported; MP4 only if the browser records it natively. Files are never renamed to fake a format.
- Dimensions are the exact selected size (e.g. 2160×3840). 4K may fail, stutter or run out of memory on phones; the UI warns, and 1080p is the safe fallback.
- Frame pacing depends on device speed; heavy settings can drop frames.
- Audio is mixed in via Web Audio, respecting start/end trim and volume. Use only music you own or may use.
## Offline / online
Everything is local after the first load (no service worker yet, so the first load needs internet). No external assets.
Preview stays pinned at the top while you scroll settings. A generic music player card effect is included (no third-party logos).
## Limits (not implemented)
IndexedDB storage (projects use localStorage; settings only, no media), undo/redo, waveform display, Web Workers, MP4 encoder library, automated tests. Parallax and Liquid Gradient are simple approximations. Nothing here has been tested in a real browser yet; see the checklist below.
## Manual checklist
Load from subpath · each background and preset changes preview · image/audio upload · volume and trim · export at 720p and 1080p plays back with audio · cancel export · save/load/import/export JSON · narrow-width layout.
