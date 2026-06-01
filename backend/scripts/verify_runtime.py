from __future__ import annotations

import json
import urllib.request

BASE_URL = "http://127.0.0.1:8000"


def _get(path: str) -> dict:
    return json.loads(urllib.request.urlopen(BASE_URL + path).read().decode())


def _post(path: str, payload: dict) -> dict:
    req = urllib.request.Request(
        BASE_URL + path,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    return json.loads(urllib.request.urlopen(req).read().decode())


def main() -> None:
    health = _get("/health")
    questions = _get("/api/questions")
    filter_response = _post(
        "/api/filter",
        {"answered_questions": {"q17": "B", "q39": "A", "q46": "A", "q4": "A"}},
    )

    count = sum(len(category.get("questions", [])) for category in questions.get("categories", []))
    print("health:", health.get("status"))
    print("questions:", count)
    print("remaining:", len(filter_response.get("remaining_countries", [])))
    top = (filter_response.get("top_recommendations") or [{}])[0]
    print("top:", top.get("iso3"), top.get("score"))


if __name__ == "__main__":
    main()
