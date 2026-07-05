from __future__ import annotations

import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List

from app.db_store import get_countries_from_db, get_questions_from_db

LOGGER = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
QUESTIONS_PATH = DATA_DIR / "questions.json"
COUNTRIES_PATH = DATA_DIR / "countries_data.json"


class DataValidationError(Exception):
    pass


def _read_json(path: Path) -> Dict[str, Any]:
    if not path.exists():
        raise DataValidationError(f"Missing data file: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_questions() -> Dict[str, Any]:
    payload = None
    try:
        payload = get_questions_from_db()
    except Exception as exc:  # pragma: no cover
        LOGGER.warning("Falling back to questions.json because DB read failed: %s", exc)

    if payload is None:
        payload = _read_json(QUESTIONS_PATH)

    categories = payload.get("categories", [])
    if len(categories) < 1:
        raise DataValidationError("questions.json must contain at least one category")

    count = sum(len(category.get("questions", [])) for category in categories)
    if count != 60:
        raise DataValidationError(f"Expected 60 questions, found {count}")
    return payload


@lru_cache(maxsize=1)
def load_countries() -> List[Dict[str, Any]]:
    db_countries = None
    try:
        db_countries = get_countries_from_db()
    except Exception as exc:  # pragma: no cover
        LOGGER.warning("Falling back to countries_data.json because DB read failed: %s", exc)

    if db_countries is not None:
        countries = db_countries
    else:
        payload = _read_json(COUNTRIES_PATH)
        countries = payload.get("countries", [])

    if len(countries) < 15:
        raise DataValidationError("countries_data.json must contain at least 15 countries")

    required = {"iso3", "country", "profiles"}
    for country in countries:
        missing = required - set(country.keys())
        if missing:
            raise DataValidationError(
                f"Country {country.get('country', 'unknown')} missing fields: {', '.join(sorted(missing))}"
            )
    return countries
