# API and Data Contracts

## API Summary

Base URL (local):

- http://localhost:8000

Main routes:

1. GET /health
2. GET /api/questions
3. POST /api/filter

## GET /health

Purpose:

- Service health and DB mode status.

Response shape:

- status: ok or degraded
- database_enabled: true or false
- database_status: disabled or ok or error
- database_error: optional text when DB connectivity fails

## GET /api/questions

Purpose:

- Return questionnaire metadata and all questions.

Response model (simplified):

- version: string
- categories: array
  - id, title
  - questions[]
    - id, number, prompt
    - options[]
      - key: A | B | C | D
      - text

Validation:

- Data loader validates there are exactly 60 questions.

## POST /api/filter

Purpose:

- Apply scoring and filtering to country profiles based on answered questions.

Request body:

{
  "answered_questions": {
    "q1": "A",
    "q2": "C"
  }
}

Response body:

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

## Scoring Model Overview

Current scoring combines:

1. Hard constraints
   - Immediate exclusion when critical condition fails.
2. Weighted preferences
   - Adds weighted matching score by profile attributes.

Scoring details:

- Score defaults to 50.0 when no weighted rule is considered.
- Otherwise score = matched / considered * 100.
- top_recommendations is top 10 sorted by score desc, country asc.

## Data Sources and Fallback

Load strategy:

1. Try database first when enabled.
2. Fallback to JSON files when DB unavailable or not configured.

Main files:

- backend/data/questions.json
- backend/data/countries_data.json

Validation guarantees:

1. questions.json has at least one category and exactly 60 questions.
2. countries_data has at least 15 countries.
3. Each country includes iso3, country, profiles.

## CORS and Client Compatibility

CORS origins are configured by backend env variable:

- CORS_ORIGINS

CSV values are parsed in app/config.py and passed to FastAPI CORS middleware.

## Test Coverage (Current)

Backend tests currently verify:

1. health endpoint contract
2. questions endpoint returns expected shape and count
3. filter endpoint contract
4. selected scoring and hard-constraint behavior
5. DB mode payload availability when DATABASE_URL is configured

## Contract Stability Notes

1. /api/filter contract is stable for current frontend.
2. Health response now includes DB metadata and should be treated as operational data.
3. Future scoring expansion should preserve response keys to avoid frontend regressions.
