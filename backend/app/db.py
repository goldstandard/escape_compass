from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import JSON, String, create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    pass


class CountryRecord(Base):
    __tablename__ = "countries"

    iso3: Mapped[str] = mapped_column(String(3), primary_key=True)
    country: Mapped[str] = mapped_column(String(120), nullable=False)
    profiles: Mapped[dict] = mapped_column(JSON, nullable=False)


class DatasetRecord(Base):
    __tablename__ = "datasets"

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)


def _build_engine():
    if not settings.database_url:
        return None
    return create_engine(settings.database_url, pool_pre_ping=True)


engine = _build_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False) if engine else None


def db_enabled() -> bool:
    return engine is not None and SessionLocal is not None


def create_schema() -> None:
    if not db_enabled():
        return
    Base.metadata.create_all(bind=engine)


@contextmanager
def get_session() -> Iterator[Session]:
    if not db_enabled() or SessionLocal is None:
        raise RuntimeError("Database is not configured. Set DATABASE_URL to enable PostgreSQL mode.")

    session = SessionLocal()
    try:
        yield session
        session.commit()
    except SQLAlchemyError:
        session.rollback()
        raise
    finally:
        session.close()
