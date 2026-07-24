from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from app.config import Settings


@dataclass
class SessionPayload:
    invite_id: str
    daily_limit: int
    issued_at: float


class SessionManager:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.serializer = URLSafeTimedSerializer(
            settings.session_secret,
            salt="ai-profile-session-v1",
        )

    def issue(self, invite_id: str, daily_limit: int) -> str:
        payload: dict[str, Any] = {
            "invite_id": invite_id,
            "daily_limit": daily_limit,
            "issued_at": time.time(),
        }
        return self.serializer.dumps(payload)

    def parse(self, token: str | None) -> SessionPayload | None:
        if not token:
            return None
        max_age = self.settings.session_ttl_hours * 3600
        try:
            data = self.serializer.loads(token, max_age=max_age)
        except (BadSignature, SignatureExpired):
            return None
        invite_id = data.get("invite_id")
        if not invite_id:
            return None
        return SessionPayload(
            invite_id=str(invite_id),
            daily_limit=int(data.get("daily_limit") or self.settings.daily_default_limit),
            issued_at=float(data.get("issued_at") or 0),
        )
