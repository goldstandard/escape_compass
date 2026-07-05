from __future__ import annotations

import main


def test_health_disables_db_when_connectivity_check_fails(monkeypatch) -> None:
    monkeypatch.setattr(main, "db_enabled", lambda: True)
    monkeypatch.setattr(main, "verify_db_connection", lambda: False)
    monkeypatch.setattr(main, "get_db_disabled_reason", lambda: "dns resolution failed")

    payload = main.health()

    assert payload["status"] == "ok"
    assert payload["database_enabled"] is False
    assert payload["database_status"] == "disabled"
    assert payload["database_disabled_reason"] == "dns resolution failed"
