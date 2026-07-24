from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from app.config import Settings, get_settings, hash_invite_code
from app.models.schemas import AccessMeResponse, VerifyRequest, VerifyResponse
from app.security.rate_limit import limiter
from app.security.session import SessionManager


router = APIRouter(prefix="/v1/access", tags=["access"])


def get_session_manager(settings: Settings = Depends(get_settings)) -> SessionManager:
    return SessionManager(settings)


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def find_invite(settings: Settings, code: str) -> dict[str, Any] | None:
    digest = hash_invite_code(code)
    for item in settings.invite_codes():
        if str(item.get("hash", "")).lower() == digest.lower():
            return item
    return None


def invite_expired(item: dict[str, Any]) -> bool:
    expires = item.get("expires_at")
    if not expires:
        return False
    try:
        dt = datetime.fromisoformat(str(expires))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone(timedelta(hours=8)))
        return datetime.now(tz=dt.tzinfo) > dt
    except ValueError:
        return False


@router.post("/verify", response_model=VerifyResponse)
def verify_access(
    body: VerifyRequest,
    request: Request,
    response: Response,
    settings: Settings = Depends(get_settings),
    sessions: SessionManager = Depends(get_session_manager),
) -> VerifyResponse:
    ip = client_ip(request)
    if limiter.verify_blocked(ip):
        raise HTTPException(status_code=429, detail="too_many_attempts")

    item = find_invite(settings, body.invite_code)
    if item is None:
        limiter.note_verify_failure(ip)
        raise HTTPException(status_code=403, detail="invalid_invite")

    if invite_expired(item):
        limiter.note_verify_failure(ip)
        raise HTTPException(status_code=403, detail="invite_expired")

    invite_id = str(item["id"])
    max_total = int(item.get("max_total_uses") or 100)
    if limiter.total_uses(invite_id) >= max_total:
        raise HTTPException(status_code=403, detail="invite_exhausted")

    daily_limit = int(item.get("daily_limit") or settings.daily_default_limit)
    token = sessions.issue(invite_id=invite_id, daily_limit=daily_limit)
    expires = datetime.now(timezone.utc) + timedelta(hours=settings.session_ttl_hours)

    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        httponly=True,
        secure=settings.cookie_secure or settings.is_production,
        samesite="lax",
        max_age=settings.session_ttl_hours * 3600,
        path="/",
    )
    limiter.clear_verify_failures(ip)

    return VerifyResponse(
        ok=True,
        expires_at=expires.isoformat(),
        daily_limit=daily_limit,
    )


@router.get("/me", response_model=AccessMeResponse)
def access_me(
    request: Request,
    settings: Settings = Depends(get_settings),
    sessions: SessionManager = Depends(get_session_manager),
) -> AccessMeResponse:
    token = request.cookies.get(settings.cookie_name)
    payload = sessions.parse(token)
    if payload is None:
        return AccessMeResponse(authenticated=False)
    remaining = limiter.remaining(payload.invite_id, payload.daily_limit)
    return AccessMeResponse(
        authenticated=True,
        remaining_questions=remaining,
        daily_limit=payload.daily_limit,
        invite_id=payload.invite_id,
    )


@router.post("/logout")
def logout(
    response: Response,
    settings: Settings = Depends(get_settings),
) -> dict[str, bool]:
    response.delete_cookie(settings.cookie_name, path="/")
    return {"ok": True}
