# Backend handoff

The published site is deliberately static. `assets/js/app.js` samples selected upload frames in the browser for a small local demonstration; its automatic monitoring panel remains simulated so it can run on GitHub Pages. A real system should place operational analysis and sensitive data behind a private backend, never in the frontend or Git repository.

## Suggested components

```text
API service
  ├── authentication / roles
  ├── camera and video-source registry
  ├── incident and evidence API
  └── WebSocket event channel

Worker service
  ├── OpenCV quality processing
  ├── MOG2 motion gating
  ├── YOLO person / vehicle detection
  ├── multi-object tracking
  └── risk-aware rule fusion

Data services
  ├── relational database: cameras, tracks, events, operator decisions
  └── private object storage: original clips and evidence extracts
```

## Minimal API contract

```text
POST /api/analysis
  Request: multipart/form-data video file + camera_id (optional)
  Response: { job_id, status: "queued" }

GET /api/analysis/:job_id
  Response: { status, source, tracks, events, evidence_url }

GET /api/incidents
  Response: { incidents: [...] }

POST /api/incidents/:id/decision
  Request: { action: "clear" | "escalate", note }

WS /api/operations/live
  Messages: source health, tracks, event results, alert state
```

An event returned to the frontend should include object class, confidence, camera, region / zone, movement direction, persistence duration, risk score, evidence reference, and authorised recipients. This directly supports the PPT logic: Zone 1 approach, Zone 2 directional movement, Zone 3 breach, then human review.

## Security requirements

- Use HTTPS, authenticated sessions, roles and server-side audit logging.
- Store RTSP credentials and provider tokens in a secrets manager, never in `app.js` or `.env` committed to Git.
- Keep evidence clips private with retention policies and signed retrieval URLs.
- Obtain appropriate consent, legal approval, liveness checks and encrypted storage before handling any facial biometric data.
