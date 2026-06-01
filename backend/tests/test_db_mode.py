from __future__ import annotations

import os

import pytest

from app.db import db_enabled
from app.db_store import get_countries_from_db, get_questions_from_db


@pytest.mark.skipif(not os.getenv("DATABASE_URL"), reason="DATABASE_URL is not configured")
def test_db_mode_has_seeded_payloads_when_enabled() -> None:
    if not db_enabled():
        pytest.skip("Database engine not enabled")

    questions = get_questions_from_db()
    countries = get_countries_from_db()

    # This test is intended for DB environments where seed has been run.
    assert questions is not None
    assert countries is not None
    assert len(countries) >= 15
    count = sum(len(category.get("questions", [])) for category in questions.get("categories", []))
    assert count == 60
