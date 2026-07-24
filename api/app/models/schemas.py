from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class VerifyRequest(BaseModel):
    invite_code: str = Field(min_length=4, max_length=64)


class VerifyResponse(BaseModel):
    ok: bool
    expires_at: str
    daily_limit: int


class AccessMeResponse(BaseModel):
    authenticated: bool
    remaining_questions: int | None = None
    daily_limit: int | None = None
    invite_id: str | None = None


class SourceRef(BaseModel):
    id: str
    title: str
    anchor: str | None = None


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=12)


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceRef] = Field(default_factory=list)
    mode: Literal["faq", "retrieval", "llm", "refusal"]
    remaining_questions: int
    suggested_questions: list[str] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: str
    knowledge_docs: int
    llm_provider: str
