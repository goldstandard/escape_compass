from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.data_loader import DataValidationError, load_questions
from app.schemas import QuestionsResponse

router = APIRouter(prefix="/api", tags=["questions"])


@router.get("/questions", response_model=QuestionsResponse)
def get_questions() -> dict:
    try:
        return load_questions()
    except DataValidationError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
