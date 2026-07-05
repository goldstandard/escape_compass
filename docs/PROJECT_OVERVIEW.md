# Project Overview

## What This Project Is

Escape Compass is a full-stack questionnaire application that helps users shortlist countries for relocation or a second home.

The user answers a 60-question wizard. After each answer:

1. The frontend sends the accumulated answers to backend API.
2. The backend computes filtered and scored countries.
3. The map updates highlighted countries in real time.
4. A shortlist panel shows top recommendations.

## Current Status

The project is currently in a strong demo state:

1. Public deployment is live.
2. End-to-end flow works (wizard -> API -> shortlist -> map).
3. Local Docker setup works.
4. Scoring logic is functional but not yet complete for all 60 questions.

## High-Level Architecture

- Frontend: React + Vite + Tailwind + Mapbox GL JS
- Backend: FastAPI + Pydantic + SQLAlchemy
- Data: JSON seed files with optional PostgreSQL storage
- Deploy: Render Blueprint (backend web service, frontend static site, PostgreSQL)

## Repository Structure

- backend/
  - main.py: FastAPI application setup, CORS, health endpoint, startup seeding
  - app/
    - api/routes/: API endpoints
    - scoring.py: hard constraints + weighted rules
    - data_loader.py: DB-first with JSON fallback
    - db.py, db_store.py: SQLAlchemy models and DB access
    - config.py: env parsing and normalization
  - data/
    - questions.json
    - countries_data.json
  - tests/
- frontend/
  - src/App.jsx: app orchestration
  - src/components/QuestionWizard.jsx
  - src/components/MapContainer.jsx
  - src/lib/api.js
- docker-compose.yml: local multi-service stack
- render.yaml: cloud deployment blueprint
- DEPLOY_PUBLIC_RENDER.md: cloud deployment quick guide
- logic-scoring-implementation.md: logic roadmap and scoring implementation guidance

## Main User Flows

1. Open app.
2. Questions are loaded from backend.
3. User answers a question.
4. Backend recalculates country list.
5. Map and top recommendations update.
6. User reaches completion state and can restart/review.

## Known Limitations

1. Scoring coverage is partial (not all question options have final tuned impact).
2. Seed dataset is intentionally lightweight compared to full world coverage.
3. Recommendation quality is demo-oriented and should be refined iteratively.

## Recommended Next Product Milestones

1. Expand scoring rules to all 60 questions.
2. Add richer country dataset and validation.
3. Add stronger test coverage for scoring expectations.
4. Improve recommendation explainability in UI.
