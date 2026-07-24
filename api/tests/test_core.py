from __future__ import annotations

import hashlib
from pathlib import Path

from fastapi.testclient import TestClient

from app.config import get_settings, hash_invite_code
from app.main import app
from app.security.rate_limit import limiter
from app.services.knowledge import knowledge_base


ROOT = Path(__file__).resolve().parents[2]
KNOWLEDGE = ROOT / "knowledge"


def setup_module() -> None:
    get_settings.cache_clear()
    import os

    digest = hash_invite_code("DEMO-2026")
    os.environ["INVITE_CODES_JSON"] = (
        f'[{{"id":"demo","hash":"{digest}","note":"test",'
        f'"expires_at":"2027-12-31T23:59:59+08:00","daily_limit":5,"max_total_uses":100}}]'
    )
    os.environ["SESSION_SECRET"] = "test-secret-key-at-least-32-characters"
    os.environ["KNOWLEDGE_DIR"] = str(KNOWLEDGE)
    os.environ["LLM_PROVIDER"] = "disabled"
    os.environ["COOKIE_SECURE"] = "false"
    os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000"
    get_settings.cache_clear()
    knowledge_base.load(KNOWLEDGE)
    limiter._chat_usage.clear()
    limiter._total_uses.clear()
    limiter._verify_fails.clear()


def test_hash_stable() -> None:
    assert hash_invite_code("demo-2026") == hashlib.sha256(b"DEMO-2026").hexdigest()


def test_knowledge_filters_verified_hr() -> None:
    assert len(knowledge_base.chunks) >= 5
    assert all(c.id for c in knowledge_base.chunks)
    assert len(knowledge_base.faq_items) >= 3


def test_verify_and_chat_faq() -> None:
    with TestClient(app) as client:
        bad = client.post("/v1/access/verify", json={"invite_code": "WRONG"})
        assert bad.status_code == 403

        ok = client.post("/v1/access/verify", json={"invite_code": "DEMO-2026"})
        assert ok.status_code == 200
        assert ok.json()["ok"] is True

        me = client.get("/v1/access/me")
        assert me.status_code == 200
        assert me.json()["authenticated"] is True

        chat = client.post(
            "/v1/chat",
            json={"message": "完整简历在哪里下载？", "history": []},
        )
        assert chat.status_code == 200
        data = chat.json()
        assert data["mode"] in {"faq", "retrieval", "llm"}
        assert "招聘平台" in data["answer"] or "简历" in data["answer"]
        assert "sources" in data


def test_chat_requires_auth() -> None:
    with TestClient(app) as client:
        resp = client.post("/v1/chat", json={"message": "你好", "history": []})
        assert resp.status_code == 401


def test_sensitive_refusal() -> None:
    with TestClient(app) as client:
        client.post("/v1/access/verify", json={"invite_code": "DEMO-2026"})
        resp = client.post("/v1/chat", json={"message": "你的期望薪资底线是多少？", "history": []})
        assert resp.status_code == 200
        assert resp.json()["mode"] == "refusal"
