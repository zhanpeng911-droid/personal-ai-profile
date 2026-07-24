from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import bootstrap_demo_hash, get_settings
from app.models.schemas import HealthResponse
from app.routers import access, chat
from app.services.knowledge import knowledge_base


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("ai_profile")


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()

    # 生产环境启动前强制校验
    prod_errors = settings.validate_for_production()
    if prod_errors:
        for err in prod_errors:
            logger.error("PRODUCTION CONFIG ERROR: %s", err)
        raise RuntimeError("生产环境配置不合规，拒绝启动：" + "; ".join(prod_errors))

    # 仅开发环境：未配置邀请码时注入 DEMO-2026 方便本地调试
    if not settings.is_production and not settings.invite_codes():
        import os

        demo = (
            '[{"id":"demo","hash":"%s","note":"local demo",'
            '"expires_at":"2027-12-31T23:59:59+08:00","daily_limit":30,"max_total_uses":1000}]'
            % bootstrap_demo_hash()
        )
        os.environ["INVITE_CODES_JSON"] = demo
        get_settings.cache_clear()
        settings = get_settings()
        logger.info("Injected demo invite code DEMO-2026 (dev only)")

    knowledge_base.load(settings.knowledge_path())
    logger.info(
        "Loaded knowledge docs=%s faq=%s path=%s",
        len(knowledge_base.chunks),
        len(knowledge_base.faq_items),
        settings.knowledge_path(),
    )
    yield


app = FastAPI(title="AI Profile API", version="0.1.0", lifespan=lifespan)
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(access.router)
app.include_router(chat.router)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    s = get_settings()
    return HealthResponse(
        status="ok",
        knowledge_docs=len(knowledge_base.chunks),
        llm_provider=s.llm_provider,
    )
