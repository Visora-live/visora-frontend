---
name: visora-angular-architect
description: Use when planning Angular architecture, folders, routes, features, services, models, guards, layouts, and state structure for VISORA.
---

# VISORA Angular Architect

Design a clean Angular frontend for a smart video surveillance dashboard.

## Inspect first
Read only:
- package.json
- angular.json
- src/app
- src/styles.scss
- src/main.ts
- routing files

Never read:
- node_modules
- dist
- .angular
- coverage
- generated files

## Architecture
Prefer feature folders:
- core
- shared
- layout
- features/auth
- features/admin
- features/stores
- features/cameras
- features/events
- features/alerts

## Rules
- Plan before editing.
- Keep components small.
- Use typed interfaces.
- Use services for API logic.
- Use guards for protected routes.
- Use lazy loading for large feature sections.
- Do not rewrite the whole app.
