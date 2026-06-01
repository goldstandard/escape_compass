from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Tuple

from dotenv import load_dotenv

load_dotenv()


def _parse_csv_env(name: str, default: str) -> Tuple[str, ...]:
    raw = os.getenv(name, default)
    values = [item.strip() for item in raw.split(",") if item.strip()]
    return tuple(values)


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv("DATABASE_URL", "").strip()
    auto_seed_db: bool = os.getenv("AUTO_SEED_DB", "true").lower() in {"1", "true", "yes", "on"}
    cors_origins: Tuple[str, ...] = _parse_csv_env(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://frontend",
    )


settings = Settings()
