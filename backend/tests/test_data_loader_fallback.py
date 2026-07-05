from __future__ import annotations

from app import data_loader


def test_load_questions_falls_back_to_json_when_db_read_fails(monkeypatch) -> None:
    data_loader.load_questions.cache_clear()

    def _raise_db_error():
        raise RuntimeError("db unavailable")

    monkeypatch.setattr(data_loader, "get_questions_from_db", _raise_db_error)

    payload = data_loader.load_questions()
    categories = payload.get("categories", [])
    question_count = sum(len(category.get("questions", [])) for category in categories)

    assert question_count == 60


def test_load_countries_falls_back_to_json_when_db_read_fails(monkeypatch) -> None:
    data_loader.load_countries.cache_clear()

    def _raise_db_error():
        raise RuntimeError("db unavailable")

    monkeypatch.setattr(data_loader, "get_countries_from_db", _raise_db_error)

    countries = data_loader.load_countries()

    assert len(countries) >= 15
    assert {"iso3", "country", "profiles"}.issubset(countries[0])
