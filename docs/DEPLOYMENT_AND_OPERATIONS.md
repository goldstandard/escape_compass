# Deployment and Operations

## Deployment Targets

1. Local multi-service stack via Docker Compose
2. Public demo deployment via Render Blueprint

## Render Blueprint Summary

Defined in render.yaml:

1. escape-finder-backend
   - type: web
   - env: docker
   - healthCheckPath: /health
2. escape-finder-frontend
   - type: web
   - runtime: static
3. escape-finder-db
   - managed PostgreSQL

## Backend Runtime on Render

Docker startup uses Render dynamic PORT:

- uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --app-dir /app

This prevents startup failures caused by hardcoded ports.

## Required Environment Variables

### Backend (Render)

1. DATABASE_URL
   - referenced from managed database connectionString
2. AUTO_SEED_DB
   - true recommended for demo seed sync
3. CORS_ORIGINS
   - must include public frontend URL

Example:

https://escape-finder-frontend.onrender.com,http://localhost:5173,http://127.0.0.1:5173

### Frontend (Render)

1. VITE_API_BASE_URL
   - set to backend public URL
2. VITE_MAPBOX_TOKEN
   - optional but required for live map tiles

## Public URLs (Current Demo)

1. Frontend: https://escape-finder-frontend.onrender.com
2. Backend: https://escape-finder-backend.onrender.com

## Deployment Procedure (Render)

1. Push latest code to GitHub main branch.
2. Trigger backend deploy.
3. Trigger frontend deploy.
4. Verify /health on backend.
5. Verify questionnaire + filtering + map on frontend.

## Post-Deploy Smoke Test

1. Backend health endpoint returns JSON.
2. Questions load in UI.
3. Answer selection updates remaining countries.
4. Top recommendations update.
5. Map shows either live globe (token present) or fallback panel (token missing).

## Troubleshooting Playbook

### Backend deploy fails at startup

Check:

1. DATABASE_URL format
   - config normalizes postgres:// to postgresql+psycopg://
2. PORT usage in Docker command
3. Render build and runtime logs

If health previously returned degraded because of DNS host resolution errors, backend now switches to JSON fallback mode automatically and reports database_status as disabled. This keeps API endpoints available for demo traffic.

### Frontend shows Failed to fetch

Check:

1. VITE_API_BASE_URL points to backend public URL
2. Backend CORS_ORIGINS includes frontend public URL
3. Backend service is live

If backend health includes database_disabled_reason with connectivity/DNS details, refresh Render backend environment for DATABASE_URL:

1. Ensure DATABASE_URL is still linked from managed database connectionString in render.yaml / dashboard.
2. Remove any stale manual DATABASE_URL value from service-level environment overrides.
3. Redeploy backend.

### Map is missing

Check:

1. VITE_MAPBOX_TOKEN is set in frontend env
2. token is valid and domain restrictions include frontend URL
3. frontend was redeployed after env update

### Results look static

This is expected in current state when scoring rules do not yet cover all question options. See:

- ../logic-scoring-implementation.md

## Cost and Reliability Notes

1. Free Render services can spin down when idle.
2. First request after idle can be slow.
3. For live demos, warm up frontend and backend shortly before presentation.

## Operational Good Practices

1. Keep .env secrets out of git.
2. Use narrow CORS_ORIGINS in public environments.
3. Validate backend tests before each deployment.
4. Keep README and docs in sync with actual env variables and routes.
