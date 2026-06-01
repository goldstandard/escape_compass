from __future__ import annotations

from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/health")
    assert response.status_code == 200

    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["database_enabled"] is False
    assert payload["database_status"] == "disabled"


def test_questions_endpoint_returns_all_questions() -> None:
    response = client.get("/api/questions")
    assert response.status_code == 200

    payload = response.json()
    categories = payload.get("categories", [])
    question_count = sum(len(category.get("questions", [])) for category in categories)

    assert payload.get("version") == "1.0"
    assert len(categories) == 8
    assert question_count == 60


def test_filter_endpoint_response_contract() -> None:
    response = client.post(
        "/api/filter",
        json={"answered_questions": {"q17": "B", "q39": "A", "q46": "A"}},
    )
    assert response.status_code == 200

    payload = response.json()
    assert "remaining_countries" in payload
    assert "top_recommendations" in payload

    remaining = payload["remaining_countries"]
    top = payload["top_recommendations"]

    assert isinstance(remaining, list)
    assert isinstance(top, list)
    assert len(remaining) > 0

    if top:
        first = top[0]
        assert {"iso3", "country", "score", "hard_constraints_passed", "matched", "considered"}.issubset(first)


def test_filter_hard_constraint_excludes_island_for_land_only_access() -> None:
    response = client.post(
        "/api/filter",
        json={"answered_questions": {"q4": "A"}},
    )
    assert response.status_code == 200

    remaining = response.json()["remaining_countries"]

    assert "NZL" not in remaining
    assert "ISL" not in remaining
