# Escape Compass

Escape Compass is a full-stack demo application that helps users shortlist countries through a 60-question wizard, live filtering, and map visualization.

## Quick Links

1. Full documentation index: [docs/README.md](docs/README.md)
2. Local setup: [docs/SETUP_LOCAL.md](docs/SETUP_LOCAL.md)
3. API and data contracts: [docs/API_AND_DATA.md](docs/API_AND_DATA.md)
4. Deployment and operations: [docs/DEPLOYMENT_AND_OPERATIONS.md](docs/DEPLOYMENT_AND_OPERATIONS.md)
5. Scoring implementation roadmap: [logic-scoring-implementation.md](logic-scoring-implementation.md)

## Public Demo

1. Frontend: https://escape-finder-frontend.onrender.com
2. Backend: https://escape-finder-backend.onrender.com

## Tech Stack

1. Frontend: React, Vite, Tailwind, Mapbox GL JS
2. Backend: FastAPI, Pydantic, SQLAlchemy
3. Data: JSON seed files, optional PostgreSQL persistence
4. Deployment: Render Blueprint via [render.yaml](render.yaml)

## Fastest Local Start

From repository root:

1. docker compose up -d --build
2. Open http://localhost:5173
3. Check backend health at http://localhost:8000/health

Stop stack:

1. docker compose down

## What Is Complete

1. End-to-end flow works (wizard -> API -> recommendations -> map/fallback panel).
2. Local Docker stack is configured and tested.
3. Public Render deployment is configured and live.
4. CORS, startup seeding, health checks, and database URL normalization are implemented.

## Current Known Product Limitation

1. Scoring logic is intentionally partial and not fully tuned for all question options.
2. Recommendation quality is therefore demo-level and should be expanded iteratively.

For implementation plan, see [logic-scoring-implementation.md](logic-scoring-implementation.md).

## Repository Layout (High Level)

1. [backend/main.py](backend/main.py): FastAPI app bootstrap, CORS, health, startup seeding
2. [backend/app/scoring.py](backend/app/scoring.py): hard constraints + weighted rules
3. [backend/app/data_loader.py](backend/app/data_loader.py): DB-first loading with JSON fallback
4. [frontend/src/App.jsx](frontend/src/App.jsx): UI orchestration and filtering lifecycle
5. [frontend/src/components/MapContainer.jsx](frontend/src/components/MapContainer.jsx): live globe and fallback panel
6. [docker-compose.yml](docker-compose.yml): local multi-service stack
7. [render.yaml](render.yaml): cloud deployment blueprint

## Contribution Notes

1. Keep secrets out of version control.
2. Run backend tests before pushing changes:
   - cd backend
   - .venv\Scripts\python -m pytest -q
3. Run frontend production build before release:
   - cd frontend
   - npm run build
