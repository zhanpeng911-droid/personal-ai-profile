from __future__ import annotations

import json
import logging
import time
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.config import Settings, get_settings
from app.models.schemas import ChatRequest, ChatResponse
from app.security.rate_limit import limiter
from app.security.session import SessionManager
from app.services.chat import ChatService, StreamMeta
from app.services.knowledge import knowledge_base
from app.services.llm import build_provider


router = APIRouter(prefix="/v1", tags=["chat"])
logger = logging.getLogger("ai_profile")


def get_session_manager(settings: Settings = Depends(get_settings)) -> SessionManager:
    return SessionManager(settings)


def get_chat_service(settings: Settings = Depends(get_settings)) -> ChatService:
    return ChatService(settings=settings, knowledge=knowledge_base, llm=build_provider(settings))


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
    sessions: SessionManager = Depends(get_session_manager),
    chat_service: ChatService = Depends(get_chat_service),
) -> ChatResponse:
    started = time.perf_counter()
    token = request.cookies.get(settings.cookie_name)
    payload = sessions.parse(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="unauthorized")

    message = body.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="empty_message")
    if len(message) > settings.max_message_chars:
        raise HTTPException(status_code=400, detail="message_too_long")

    try:
        remaining = limiter.consume_chat(payload.invite_id, payload.daily_limit)
    except ValueError:
        raise HTTPException(status_code=429, detail="daily_limit_exceeded") from None

    result = await chat_service.answer(
        message=message,
        history=body.history,
        remaining_after=remaining,
    )

    latency_ms = int((time.perf_counter() - started) * 1000)
    logger.info(
        "chat_completed invite_id=%s mode=%s latency_ms=%s status=200",
        payload.invite_id,
        result.mode,
        latency_ms,
    )
    return result


@router.post("/chat/stream")
async def chat_stream(
    body: ChatRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
    sessions: SessionManager = Depends(get_session_manager),
    chat_service: ChatService = Depends(get_chat_service),
) -> StreamingResponse:
    """流式问答。SSE 格式：
    data: {"type":"meta","sources":[...],"mode":"llm","remaining_questions":N,"suggested_questions":[...]}
    data: {"type":"delta","content":"..."}
    data: {"type":"done"}
    非 LLM 模式直接发 {"type":"complete","answer":"...","sources":[...],...}
    """
    token = request.cookies.get(settings.cookie_name)
    payload = sessions.parse(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="unauthorized")

    message = body.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="empty_message")
    if len(message) > settings.max_message_chars:
        raise HTTPException(status_code=400, detail="message_too_long")

    try:
        remaining = limiter.consume_chat(payload.invite_id, payload.daily_limit)
    except ValueError:
        raise HTTPException(status_code=429, detail="daily_limit_exceeded") from None

    async def event_stream() -> AsyncIterator[str]:
        try:
            async for item in chat_service.answer_stream(
                message=message,
                history=body.history,
                remaining_after=remaining,
            ):
                if isinstance(item, ChatResponse):
                    # 非 LLM 模式，直接发完整响应
                    yield f"data: {json.dumps({'type': 'complete', **item.model_dump()}, ensure_ascii=False)}\n\n"
                elif isinstance(item, StreamMeta):
                    meta_data = {
                        "type": "meta",
                        "sources": [s.model_dump() for s in item.sources],
                        "mode": item.mode,
                        "remaining_questions": item.remaining_questions,
                        "suggested_questions": item.suggested_questions,
                    }
                    yield f"data: {json.dumps(meta_data, ensure_ascii=False)}\n\n"
                elif isinstance(item, str):
                    yield f"data: {json.dumps({'type': 'delta', 'content': item}, ensure_ascii=False)}\n\n"
        except Exception as exc:
            logger.warning("chat_stream_error invite_id=%s %s", payload.invite_id, exc)
            yield f"data: {json.dumps({'type': 'error', 'message': '生成过程中出现异常'}, ensure_ascii=False)}\n\n"
        finally:
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
