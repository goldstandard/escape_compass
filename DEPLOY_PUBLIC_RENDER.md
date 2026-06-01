# Public Demo Deployment (Render)

This guide gets you a public, shareable demo URL as fast as possible.

## Prerequisites

1. GitHub repo with this project pushed.
2. Render account connected to your GitHub account.

## 1) Deploy from Blueprint

1. In Render, click New + -> Blueprint.
2. Select your GitHub repository.
3. Render will detect `render.yaml` in repo root.
4. Start deployment.

This creates:

1. `escape-finder-backend` (Docker web service)
2. `escape-finder-frontend` (static site)
3. `escape-finder-db` (PostgreSQL)

## 2) Set frontend env vars

After first deploy, open `escape-finder-frontend` -> Environment and set:

1. `VITE_API_BASE_URL` to your backend public URL, for example:
   - `https://escape-finder-backend.onrender.com`
2. Optional: `VITE_MAPBOX_TOKEN`
   - if not set, app uses built-in fallback panel instead of live map tiles.

Trigger a redeploy of frontend after saving env vars.

## 3) Set backend CORS for your frontend URL

Open `escape-finder-backend` -> Environment and set `CORS_ORIGINS`.

Example value:

`https://escape-finder-frontend.onrender.com,http://localhost:5173,http://127.0.0.1:5173`

Trigger backend redeploy.

## 4) Smoke test

1. Check backend health URL:
   - `https://escape-finder-backend.onrender.com/health`
2. Open frontend URL:
   - `https://escape-finder-frontend.onrender.com`
3. Verify that:
   - questions load,
   - selecting answers updates shortlist,
   - map/fallback panel updates.

## 5) Shareable link

Share the frontend URL:

`https://escape-finder-frontend.onrender.com`

If Render app name is adjusted to avoid collisions, use the exact URL shown in your Render dashboard.

## Troubleshooting

1. Frontend shows `Failed to fetch`:
   - check `VITE_API_BASE_URL` on frontend,
   - check `CORS_ORIGINS` on backend.
2. Health is `degraded`:
   - check database service status in Render.
3. Map missing:
   - set valid `VITE_MAPBOX_TOKEN`, or continue using fallback mode for demo.
