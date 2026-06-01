from __future__ import annotations

from app.data_loader import load_countries
from app.scoring import score_countries


def test_score_countries_no_answers_returns_all_seeded() -> None:
    countries = load_countries()
    remaining, top = score_countries(countries, {})

    assert len(remaining) == len(countries)
    assert len(top) > 0


def test_score_countries_top_sorted_desc() -> None:
    countries = load_countries()
    _, top = score_countries(countries, {"q39": "A", "q46": "A", "q32": "A"})

    scores = [entry.score for entry in top]
    assert scores == sorted(scores, reverse=True)


def test_score_countries_applies_hard_constraints() -> None:
    countries = load_countries()
    remaining, _ = score_countries(countries, {"q4": "A"})

    assert "AUS" not in remaining
    assert "JPN" not in remaining
