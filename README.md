# VortIQ Border Operations — Prototype

A calm frontend prototype for an AI-assisted border video-analytics command centre. It can run locally or on GitHub Pages without credentials, a camera, or a server. The automatic monitoring panel remains a simulation; **Clip analysis** now reads the frames of the file selected in the browser.

## Project structure

```text
vortiq-border-operations/
├── index.html                        # Semantic page structure only
├── assets/
│   ├── css/styles.css                 # Theme, layout, responsive design, tooltips
│   ├── js/app.js                      # UI state, sampled-frame motion and object analysis
│   ├── images/vortiq-logo.jpeg        # Supplied VortIQ logo
│   └── demo-clips/                    # Generated animated CCTV demonstrations
├── backend/README.md                  # Contract for the future real AI service
├── start-local.ps1                    # Local static web server
├── .github/workflows/deploy-pages.yml # Automatic GitHub Pages deployment
└── .gitignore                         # Prevents secrets/data from being committed
```

The HTML, CSS, and JavaScript are intentionally separate so that layout, styling, and browser behaviour can be edited independently in GitHub.

## Run locally on a laptop

1. Install Python 3 if it is not already installed.
2. Open PowerShell in this project folder.
3. Run:

   ```powershell
   .\start-local.ps1
   ```

4. Open [http://localhost:8080](http://localhost:8080).
5. Use `Ctrl+C` in PowerShell to stop the server.

Opening `index.html` directly also works for a quick preview, but running the local server is more consistent with GitHub Pages.

## Demo walkthrough

1. Select a visible demo account. The screen fills its username and password; all accounts use password `vortiq2026`.
2. Select **Verify & sign in**. Facial recognition is a visual simulation only—no camera or biometrics are used.
3. The **Overview** camera wall is deliberately quiet: only A-05 displays its movement detector.
4. **Live monitoring** automatically processes a simulated saved clip every 8 seconds and reports the event outcome. Its green box is different: it is redrawn from the person detector on the current video frame, so it disappears when no person is detected.
5. On **Clip analysis**, upload a local video or choose an animated demo. Select **Analyse selected clip**. The browser samples frames from that file, measures frame-to-frame change, and—when the browser object model is available—reports detected people or vehicles with the actual peak confidence. Sustained movement creates a simulated incident automatically. It does not derive a result from the filename.
6. Use **Incident desk** to review, clear, or escalate a simulated incident.

## Publish on GitHub Pages

Create an empty GitHub repository, then run the following from this project directory. Replace `YOUR-USER` with your GitHub user or organisation name.

```powershell
git init
git add .
git commit -m "Create VortIQ border operations prototype"
git branch -M main
git remote add origin https://github.com/YOUR-USER/vortiq-border-operations.git
git push -u origin main
```

Then open the repository on GitHub and set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. The included workflow deploys every push to `main`. It uses GitHub’s supported Pages actions, as described in [the official GitHub Pages workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## What is simulated vs. real

| Prototype behaviour | Real deployment replacement |
| --- | --- |
| Face login screen | Consent-based identity provider, liveness checks and encrypted template storage |
| Upload and clip analysis | Browser samples the selected video locally; production should use an authenticated `POST /api/analysis` video upload job |
| YOLO, MOG2, tracking and risk result | Python worker(s) running OpenCV, MOG2, YOLO, tracking and rule fusion |
| 8-second job loop | Queue / RTSP worker and WebSocket event stream |
| Border-force alert button | Authorised C2, radio, SMS or incident-management integration |

See [backend/README.md](backend/README.md) for the recommended API contract. Never commit real camera URLs, access tokens, biometric data, evidence videos, incident records, or environment files. `.gitignore` already excludes these future runtime assets.

## Clip-analysis behaviour and limits

The page loads TensorFlow.js and the COCO-SSD object model from a CDN. With an internet connection, it analyses a small set of frames from the clip in the browser and recognises people and common vehicles. Frame-to-frame change is measured locally even when the model is unavailable. The results include duration, resolution, sample count, motion percentage and detector state so an operator can see what was actually inspected.

This frontend does **not** call a person/vehicle observation a border breach. A real breach outcome needs a sector-specific zone or line-of-interest map, an evidence store, a server-side YOLO/OpenCV tracker and authorised human review. For a field deployment, replace the browser model with the backend workflow in [backend/README.md](backend/README.md).
