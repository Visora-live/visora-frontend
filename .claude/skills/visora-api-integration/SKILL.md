---
name: visora-api-integration
description: Use when integrating Angular frontend with FastAPI backend, REST endpoints, WebSocket or Socket.IO events, alerts, cameras, stores, users, and evidence data.
---

# VISORA API Integration

Integrate Angular with backend APIs safely and cleanly.

## Rules
- Keep API calls inside services.
- Use typed interfaces.
- Centralize environment URLs.
- Handle loading, error and empty states.
- Never hardcode production secrets.
- Use mock adapters when backend is not ready.
- Use WebSocket or Socket.IO only for real-time alerts and camera status.
- Keep visual detection output as data from backend, not frontend model logic.

## Expected entities
- User
- Role
- Store
- Camera
- Event
- Alert
- Evidence
- RecognitionResult
