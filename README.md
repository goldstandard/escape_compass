# Global Escape & Second Home Finder

Full-stack scaffold for a live 60-question country finder.

## Stack
- Frontend: React + Vite + Tailwind + Mapbox GL JS
- Backend: FastAPI (Python 3.11+)
- Seed data: JSON files in backend/data

## Project Structure
- backend/main.py - FastAPI entrypoint with CORS and router inclusion
- backend/app/schemas.py - API and domain models
- backend/app/scoring.py - hybrid hard-constraints + weighted scoring
- backend/data/questions.json - generated from questionnaire markdown
- backend/data/countries_data.json - country profiles (15+ sample countries)
- frontend/src/App.jsx - split layout and global state orchestration
- frontend/src/components/QuestionWizard.jsx - one-question wizard with progress
- frontend/src/components/MapContainer.jsx - live map fade rendering

## Backend Setup
1. Create a venv and install dependencies:
   - `cd backend`
   - `python -m venv .venv`
   - `.venv\\Scripts\\activate`
   - `pip install -r requirements.txt`
2. Run API:
   - `python -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000`
3. Open docs:
   - `http://localhost:8000/docs`
4. Run backend tests:
   - `cd backend`
   - `.venv\\Scripts\\python -m pytest -q`
   - note: DB-only tests auto-skip unless `DATABASE_URL` is set

## PostgreSQL Mode
1. Start local PostgreSQL:
   - `docker compose up -d postgres`
2. Check service health:
   - `docker compose ps`
3. Copy `backend/.env.example` to `backend/.env` and set a valid `DATABASE_URL`.
4. Install dependencies from `backend/requirements.txt`.
5. Seed database from JSON files:
   - `cd backend`
   - `.venv\\Scripts\\python scripts/seed_postgres.py`
6. Start API as usual. On startup, API will attempt DB schema creation and seed sync when `AUTO_SEED_DB=true`.
7. If DB is unavailable, API automatically falls back to JSON files so local development remains unblocked.

## Runtime Smoke Check
1. Start backend API.
2. Run:
   - `cd backend`
   - `.venv\\Scripts\\python scripts/verify_runtime.py`
3. The script verifies `/health`, `/api/questions`, and `/api/filter` in one pass.

## Frontend Setup
1. Install dependencies:
   - `cd frontend`
   - `npm install`
2. Configure env:
   - copy `frontend/.env.example` to `frontend/.env`
   - set `VITE_MAPBOX_TOKEN`
   - optional: adjust `VITE_API_BASE_URL`
3. Run dev server:
   - `npm run dev`

## Public Demo Deployment
Use Render Blueprint deployment with the checked-in `render.yaml`.

1. Push repository to GitHub.
2. In Render, create a new Blueprint from this repo.
3. Follow the full step-by-step guide in `DEPLOY_PUBLIC_RENDER.md`.

Important:
- Set frontend env `VITE_API_BASE_URL` to backend public URL.
- Set backend env `CORS_ORIGINS` to include your frontend public URL.

## API Contract
### GET /api/questions
Returns categories and all 60 parsed questions from `escape_location_questionnaire.md`.

### POST /api/filter
Request:
```json
{
  "answered_questions": {
    "q1": "A",
    "q2": "C"
  }
}
```

Response:
```json
{
  "remaining_countries": ["PRT", "ESP", "CRI"],
  "top_recommendations": [
    {
      "iso3": "PRT",
      "country": "Portugal",
      "score": 87.4,
      "hard_constraints_passed": true,
      "matched": 18,
      "considered": 23
    }
  ]
}
```

## Notes
- Live map effect is implemented through dynamic Mapbox fill expressions driven by `remaining_countries`.
- Countries not matching current answers are faded in real-time.
- Current seed set is intentionally lightweight and can be expanded to full world coverage later.
