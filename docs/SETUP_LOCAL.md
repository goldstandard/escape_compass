# Local Setup and Runbook

## Prerequisites

Minimum required for easiest run:

1. Docker Desktop (with WSL on Windows)

Optional for non-Docker local development:

1. Python 3.11+
2. Node.js 20+

## Option A: Recommended Local Start (Docker)

From repository root:

1. Build and run all services
   - docker compose up -d --build
2. Check status
   - docker compose ps

Expected endpoints:

- Frontend: http://localhost:5173
- Backend health: http://localhost:8000/health
- PostgreSQL: localhost:5432

Stop services:

- docker compose down

Stop services and remove DB volume:

- docker compose down -v

## Option B: Backend and Frontend Without Docker

### Backend

From repository root:

1. cd backend
2. python -m venv .venv
3. .venv\Scripts\activate
4. pip install -r requirements.txt
5. python -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000

### Frontend

From repository root:

1. cd frontend
2. npm install
3. Copy .env.example to .env
4. Configure VITE_API_BASE_URL and optional VITE_MAPBOX_TOKEN
5. npm run dev

## Environment Variables

### Backend

Defined in backend/.env.example:

1. DATABASE_URL
2. AUTO_SEED_DB
3. CORS_ORIGINS

Notes:

- DATABASE_URL is optional for local JSON mode.
- If DATABASE_URL is present, startup attempts DB seeding.
- CORS_ORIGINS is CSV and parsed in app/config.py.

### Frontend

Defined in frontend/.env.example:

1. VITE_API_BASE_URL
2. VITE_MAPBOX_TOKEN

Notes:

- Without VITE_MAPBOX_TOKEN the app uses a map fallback panel and remains usable.

## Local Verification Checklist

1. Backend health responds 200 with JSON payload.
2. GET /api/questions returns all categories and 60 questions.
3. POST /api/filter returns remaining_countries and top_recommendations.
4. Frontend loads questionnaire and updates shortlist on answer click.
5. Map or fallback panel updates active country count.

## Useful Commands

From repository root:

- docker compose logs backend
- docker compose logs frontend
- docker compose logs postgres
- docker compose ps

Backend tests:

1. cd backend
2. .venv\Scripts\python -m pytest -q

Frontend production build:

1. cd frontend
2. npm run build

## Typical Local Issues

1. Port conflict on 8000 or 5173
   - stop conflicting process or change exposed ports
2. Backend starts but /api/filter fails in DB mode
   - verify DATABASE_URL and DB health
3. Browser CORS errors
   - verify backend CORS_ORIGINS includes frontend origin
4. Map not visible
   - add VITE_MAPBOX_TOKEN or use fallback mode
