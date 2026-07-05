from __future__ import annotations

import json
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.routes.filter import router as filter_router
from app.api.routes.questions import router as questions_router
from app.config import settings
from app.db import db_enabled, get_db_disabled_reason, get_session, verify_db_connection
from app.db_store import seed_database

LOGGER = logging.getLogger(__name__)
BASE_DIR = Path(__file__).resolve().parent


def startup_seed_database() -> None:
    if not settings.auto_seed_db:
        return

    if db_enabled() and not verify_db_connection():
        LOGGER.warning("PostgreSQL connectivity check failed at startup, switching to JSON data fallback")

    if not db_enabled():
        return

    try:
        countries_payload = json.loads((BASE_DIR / "data" / "countries_data.json").read_text(encoding="utf-8"))
        questions_payload = json.loads((BASE_DIR / "data" / "questions.json").read_text(encoding="utf-8"))
        seed_database(countries_payload=countries_payload, questions_payload=questions_payload)
        LOGGER.info("PostgreSQL schema ready and seed sync completed")
    except Exception as exc:  # pragma: no cover
        # Keep local development resilient: API still works via JSON fallback.
        LOGGER.warning("DB startup seed skipped due to error: %s", exc)


@asynccontextmanager
async def lifespan(_: FastAPI):
    startup_seed_database()
    yield

app = FastAPI(
    title="Global Escape & Second Home Finder API",
    description="FastAPI backend for a 60-question location filtering wizard",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    payload = {"status": "ok", "database_enabled": db_enabled()}

    if not db_enabled():
        payload["database_status"] = "disabled"
        reason = get_db_disabled_reason()
        if reason:
            payload["database_disabled_reason"] = reason
        return payload

    if not verify_db_connection():
        payload["database_enabled"] = False
        payload["database_status"] = "disabled"
        payload["status"] = "ok"
        reason = get_db_disabled_reason()
        if reason:
            payload["database_disabled_reason"] = reason
        return payload

    try:
        with get_session() as session:
            session.execute(text("SELECT 1"))
        payload["database_status"] = "ok"
    except Exception as exc:  # pragma: no cover
        payload["status"] = "degraded"
        payload["database_status"] = "error"
        payload["database_error"] = str(exc)

    return payload


app.include_router(questions_router)
app.include_router(filter_router)
