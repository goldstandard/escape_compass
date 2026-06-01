from __future__ import annotations

import json
from pathlib import Path

from app.db import db_enabled
from app.db_store import seed_database

ROOT = Path(__file__).resolve().parents[2]
COUNTRIES_PATH = ROOT / "backend" / "data" / "countries_data.json"
QUESTIONS_PATH = ROOT / "backend" / "data" / "questions.json"


def main() -> None:
    if not db_enabled():
        raise SystemExit("DATABASE_URL is not configured. Set it in environment or backend/.env.")

    countries_payload = json.loads(COUNTRIES_PATH.read_text(encoding="utf-8"))
    questions_payload = json.loads(QUESTIONS_PATH.read_text(encoding="utf-8"))

    seed_database(countries_payload=countries_payload, questions_payload=questions_payload)
    print("Database seeded successfully from JSON payloads.")


if __name__ == "__main__":
    main()
