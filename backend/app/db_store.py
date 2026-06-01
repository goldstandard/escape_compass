from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List

from sqlalchemy import select

from app.db import CountryRecord, DatasetRecord, create_schema, db_enabled, get_session


def seed_database(countries_payload: Dict[str, Any], questions_payload: Dict[str, Any]) -> None:
    if not db_enabled():
        return

    create_schema()

    countries = countries_payload.get("countries", [])
    with get_session() as session:
        for item in countries:
            session.merge(
                CountryRecord(
                    iso3=item["iso3"],
                    country=item["country"],
                    profiles=item["profiles"],
                )
            )

        session.merge(DatasetRecord(key="questions", payload=questions_payload))


def get_questions_from_db() -> Dict[str, Any] | None:
    if not db_enabled():
        return None

    with get_session() as session:
        stmt = select(DatasetRecord).where(DatasetRecord.key == "questions")
        row = session.execute(stmt).scalar_one_or_none()
        if row is None:
            return None
        return row.payload


def get_countries_from_db() -> List[Dict[str, Any]] | None:
    if not db_enabled():
        return None

    with get_session() as session:
        stmt = select(CountryRecord).order_by(CountryRecord.country.asc())
        rows = session.execute(stmt).scalars().all()

    if not rows:
        return None

    return [
        {
            "iso3": row.iso3,
            "country": row.country,
            "profiles": row.profiles,
        }
        for row in rows
    ]
