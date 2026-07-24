from __future__ import annotations

import hashlib
import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class InviteCodeConfig(BaseSettings):
    id: str
    hash: str
    note: str = ""
    expires_at: str | None = None
    daily_limit: int = 30
    max_total_uses: int = 100


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    allowed_origins: str = "http://localhost:3000"
    session_secret: str = "dev-only-change-me-32chars-minimum!!"
    invite_codes_json: str = "[]"
    daily_default_limit: int = 30
    max_message_chars: int = 800
    max_response_chars: int = 1500
    llm_provider: str = "disabled"
    llm_base_url: str = ""
    llm_api_key: str = ""
    llm_model: str = ""
    knowledge_dir: str = "../knowledge"
    cookie_name: str = "ai_profile_session"
    cookie_secure: bool = False
    session_ttl_hours: int = 12
    verify_fail_limit: int = 10
    verify_fail_window_seconds: int = 600

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    def validate_for_production(self) -> list[str]:
        """生产环境启动前校验，返回错误信息列表（空列表表示通过）。"""
        errors: list[str] = []
        if not self.is_production:
            return errors
        if self.session_secret in {
            "dev-only-change-me-32chars-minimum!!",
            "local-dev-secret-please-change-32chars-min",
        } or len(self.session_secret) < 32:
            errors.append("SESSION_SECRET 必须在生产环境设置为 32+ 字符的随机串")
        if not self.cookie_secure:
            errors.append("COOKIE_SECURE 必须在生产环境设为 true")
        return errors

    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    def knowledge_path(self) -> Path:
        path = Path(self.knowledge_dir)
        if not path.is_absolute():
            path = (Path(__file__).resolve().parent.parent / path).resolve()
        return path

    def invite_codes(self) -> list[dict[str, Any]]:
        raw = self.invite_codes_json.strip()
        if not raw:
            return []
        data = json.loads(raw)
        if not isinstance(data, list):
            raise ValueError("INVITE_CODES_JSON must be a JSON array")
        return data


@lru_cache
def get_settings() -> Settings:
    return Settings()


def hash_invite_code(code: str) -> str:
    normalized = code.strip().upper()
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def bootstrap_demo_hash() -> str:
    """sha256 of DEMO-2026 for local default."""
    return hash_invite_code("DEMO-2026")
