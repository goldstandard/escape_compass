# Global Escape & Second Home Finder - Implementation Plan

## Goal
Build a full-stack web application with:
- FastAPI backend (Python 3.11+)
- React + Vite + Tailwind frontend
- Mapbox world map with live country fade filtering
- 60-question wizard based on `escape_location_questionnaire.md`

## Architecture

### Monorepo Layout
- `backend/` - FastAPI service, scoring engine, seed data
- `frontend/` - Vite React client, wizard UI, map visualization

### Data Flow
1. Frontend loads questions from `GET /api/questions`.
2. User answers one question at a time.
3. Frontend sends current answer state to `POST /api/filter`.
4. Backend returns:
   - `remaining_countries`: ISO3 list still eligible
   - `top_recommendations`: scored countries
5. Frontend map updates fill opacity in real-time:
   - active countries highlighted
   - excluded countries grayed/faded

## Phase Plan

### Phase 1: Foundation
1. Create `backend/` and `frontend/` structure.
2. Add backend dependencies and app entrypoint.
3. Add frontend Vite/Tailwind/Mapbox setup and env templates.

### Phase 2: Questionnaire + Seed Data
1. Normalize questionnaire into JSON (`backend/data/questions.json`).
2. Create `backend/data/countries_data.json` with at least 15 countries and profile attributes.
3. Add data loader and validation.

### Phase 3: Backend API
1. `schemas.py` with Pydantic models:
   - `UserAnswer`
   - `QuestionnaireState`
   - `CountryScore`
   - API request/response models
2. `scoring.py` hybrid engine:
   - hard constraints for key incompatibilities
   - weighted scoring for soft preferences
3. `main.py` with CORS and routes:
   - `GET /api/questions`
   - `POST /api/filter`
   - `GET /health`

### Phase 4: Frontend UI + Map
1. `QuestionWizard.jsx`: one-question-at-a-time, progress bar, answer handling.
2. `MapContainer.jsx`: Mapbox map + dynamic fill-opacity expression by ISO3 list.
3. `App.jsx`: split-pane layout, global app state, API orchestration.

### Phase 5: Integration + Verification
1. Validate API contract and real-time map behavior.
2. Add loading/error states.
3. Add README run instructions.

## API Contract

### GET `/api/questions`
Returns category/question metadata from normalized JSON.

### POST `/api/filter`
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

## Verification Checklist
1. Backend starts and serves OpenAPI docs.
2. `GET /api/questions` returns all 60 questions.
3. `POST /api/filter` narrows country set as answers accumulate.
4. Frontend split view works desktop/mobile.
5. Map updates fade effect instantly after each answer.

## Notes
- Mapbox token is provided via env (`VITE_MAPBOX_TOKEN`).
- Initial implementation uses sample seed countries and extendable scoring rules.
- Production-ready extensions (auth, persistence, full country dataset) are out of initial scope.
