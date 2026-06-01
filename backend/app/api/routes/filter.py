from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.data_loader import DataValidationError, load_countries
from app.schemas import FilterRequest, FilterResponse
from app.scoring import score_countries

router = APIRouter(prefix="/api", tags=["filtering"])


@router.post("/filter", response_model=FilterResponse)
def filter_countries(payload: FilterRequest) -> dict:
    try:
        countries = load_countries()
    except DataValidationError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    remaining, top = score_countries(countries, payload.answered_questions)
    return {
        "remaining_countries": remaining,
        "top_recommendations": [item.model_dump() for item in top],
    }
