from __future__ import annotations

import re
from collections.abc import AsyncIterator
from dataclasses import dataclass

from app.config import Settings
from app.models.schemas import ChatMessage, ChatResponse, SourceRef
from app.services.knowledge import KnowledgeBase
from app.services.llm import SYSTEM_PROMPT, LLMProvider
from app.services.retrieve import faq_match, retrieve


@dataclass
class StreamMeta:
    """流式开始前发送的元数据。"""
    sources: list[SourceRef]
    mode: str
    remaining_questions: int
    suggested_questions: list[str]


SENSITIVE_PATTERNS = [
    r"薪资|工资|底薪|期望薪|年薪|月薪",
    r"住址|家庭住址|身份证|护照|银行卡",
    r"提示词|system prompt|忽略以上|jailbreak|开发者模式",
    r"源码|内部文档|未公开",
]

# 检索阈值：min_score 过滤弱相关，min_top_score 要求最高分足够才进 LLM
RETRIEVAL_MIN_SCORE = 0.25
RETRIEVAL_MIN_TOP_SCORE = 0.35

# LLM 回答中如包含这些拒答信号，视为模型自行判断资料不足
REFUSAL_SIGNALS = ["没有可验证的资料", "资料来确认", "建议通过招聘平台", "无法确认"]


DEFAULT_SUGGESTIONS = [
    "你的求职方向是什么？",
    "NovaMind 解决了什么问题？",
    "AI 分身的回答可信吗？",
    "完整简历在哪里看？",
]

REFUSAL_ANSWER = (
    "这个问题我没有可验证的资料来确认。"
    "我只能基于已审核的公开求职资料回答，不编造个人事实。"
    "你可以换个与项目、技能或求职方向相关的问题，"
    "或通过招聘平台 / 公开联系方式与本人沟通。"
)


class ChatService:
    def __init__(
        self,
        settings: Settings,
        knowledge: KnowledgeBase,
        llm: LLMProvider,
    ) -> None:
        self.settings = settings
        self.knowledge = knowledge
        self.llm = llm

    async def answer(
        self,
        message: str,
        history: list[ChatMessage],
        remaining_after: int,
    ) -> ChatResponse:
        text = message.strip()
        if len(text) > self.settings.max_message_chars:
            text = text[: self.settings.max_message_chars]

        if self._is_sensitive(text):
            return ChatResponse(
                answer=(
                    "这个问题涉及隐私边界或系统安全边界。"
                    "我只能基于已审核的公开求职资料回答，"
                    "完整简历请在招聘平台查看，其他细节请直接联系本人。"
                ),
                sources=[SourceRef(id="interview-boundaries", title="回答边界")],
                mode="refusal",
                remaining_questions=remaining_after,
                suggested_questions=DEFAULT_SUGGESTIONS[:3],
            )

        faq_item, faq_score = faq_match(text, self.knowledge.faq_items)
        if faq_item is not None:
            return ChatResponse(
                answer=faq_item.answer,
                sources=[SourceRef(id=faq_item.source_id, title="精选 FAQ", anchor=faq_item.question)],
                mode="faq",
                remaining_questions=remaining_after,
                suggested_questions=self._suggestions(exclude=text),
            )

        scored = retrieve(text, self.knowledge.chunks, top_k=5, min_score=RETRIEVAL_MIN_SCORE)
        if not scored or scored[0].score < RETRIEVAL_MIN_TOP_SCORE:
            return ChatResponse(
                answer=REFUSAL_ANSWER,
                sources=[],
                mode="refusal",
                remaining_questions=remaining_after,
                suggested_questions=DEFAULT_SUGGESTIONS,
            )

        sources = [
            SourceRef(id=s.chunk.id, title=s.chunk.title, anchor=s.anchor)
            for s in scored[:3]
        ]
        context_chunks = [s.chunk for s in scored]

        # Try LLM
        provider_name = (self.settings.llm_provider or "disabled").lower()
        if provider_name not in {"disabled", "off", "none"}:
            try:
                raw = await self.llm.generate(
                    system_prompt=SYSTEM_PROMPT,
                    user_message=text,
                    context=context_chunks,
                    history=history,
                )
                # 剥离来源行后校验
                raw = self._strip_source_refs(raw)
                # 校验：拒答 -> 降级拒答
                override = self._validate_llm_answer(raw, sources)
                answer = (override if override is not None else raw)[: self.settings.max_response_chars]
                return ChatResponse(
                    answer=answer,
                    sources=sources if override is None else [],
                    mode="llm" if override is None else "refusal",
                    remaining_questions=remaining_after,
                    suggested_questions=self._suggestions(exclude=text),
                )
            except Exception:
                pass

        # Retrieval fallback
        excerpts = []
        for s in scored[:3]:
            body = s.chunk.summary or s.chunk.body[:280]
            excerpts.append(f"【{s.chunk.title}】{body}")
        answer = (
            "当前 AI 生成暂不可用或未配置模型。根据已审核资料摘录如下：\n\n"
            + "\n\n".join(excerpts)
            + "\n\n如需完整简历，请在招聘平台下载；如需进一步确认，请联系本人。"
        )
        return ChatResponse(
            answer=answer[: self.settings.max_response_chars],
            sources=sources,
            mode="retrieval",
            remaining_questions=remaining_after,
            suggested_questions=self._suggestions(exclude=text),
        )

    def _prepare(self, message: str, history: list[ChatMessage], remaining_after: int):
        """返回 (text, ChatResponse | None, scored | None)。
        若返回 ChatResponse 表示可直接回复（敏感/FAQ/无检索结果），无需流式。
        """
        text = message.strip()
        if len(text) > self.settings.max_message_chars:
            text = text[: self.settings.max_message_chars]

        if self._is_sensitive(text):
            return text, ChatResponse(
                answer=(
                    "这个问题涉及隐私边界或系统安全边界。"
                    "我只能基于已审核的公开求职资料回答，"
                    "完整简历请在招聘平台查看，其他细节请直接联系本人。"
                ),
                sources=[SourceRef(id="interview-boundaries", title="回答边界")],
                mode="refusal",
                remaining_questions=remaining_after,
                suggested_questions=DEFAULT_SUGGESTIONS[:3],
            ), None

        faq_item, _ = faq_match(text, self.knowledge.faq_items)
        if faq_item is not None:
            return text, ChatResponse(
                answer=faq_item.answer,
                sources=[SourceRef(id=faq_item.source_id, title="精选 FAQ", anchor=faq_item.question)],
                mode="faq",
                remaining_questions=remaining_after,
                suggested_questions=self._suggestions(exclude=text),
            ), None

        scored = retrieve(text, self.knowledge.chunks, top_k=5, min_score=RETRIEVAL_MIN_SCORE)
        if not scored or scored[0].score < RETRIEVAL_MIN_TOP_SCORE:
            return text, ChatResponse(
                answer=REFUSAL_ANSWER,
                sources=[],
                mode="refusal",
                remaining_questions=remaining_after,
                suggested_questions=DEFAULT_SUGGESTIONS,
            ), None

        return text, None, scored

    async def answer_stream(
        self,
        message: str,
        history: list[ChatMessage],
        remaining_after: int,
    ) -> AsyncIterator:
        """流式回答。先 yield StreamMeta，再逐块 yield str，最后视情况 yield ChatResponse 覆盖。
        若非 LLM 模式（敏感/FAQ/拒答），直接 yield 完整 ChatResponse 后结束。
        """
        text, direct_response, scored = self._prepare(message, history, remaining_after)

        if direct_response is not None:
            yield direct_response
            return

        sources = [
            SourceRef(id=s.chunk.id, title=s.chunk.title, anchor=s.anchor)
            for s in scored[:3]
        ]
        context_chunks = [s.chunk for s in scored]

        provider_name = (self.settings.llm_provider or "disabled").lower()
        if provider_name not in {"disabled", "off", "none"}:
            try:
                yield StreamMeta(
                    sources=sources,
                    mode="llm",
                    remaining_questions=remaining_after,
                    suggested_questions=self._suggestions(exclude=text),
                )
                full = ""
                async for chunk in self.llm.stream_generate(
                    system_prompt=SYSTEM_PROMPT,
                    user_message=text,
                    context=context_chunks,
                    history=history,
                ):
                    full += chunk
                    if len(full) <= self.settings.max_response_chars:
                        yield chunk
                # 流式结束后清洗 + 校验，发 complete 覆盖前端已显示的脏流
                cleaned = self._strip_source_refs(full)
                override = self._validate_llm_answer(cleaned, sources)
                if override is not None:
                    yield ChatResponse(
                        answer=override,
                        sources=[],
                        mode="refusal",
                        remaining_questions=remaining_after,
                        suggested_questions=DEFAULT_SUGGESTIONS,
                    )
                elif cleaned != full:
                    # 有来源行被剥离，用干净文本覆盖
                    yield ChatResponse(
                        answer=cleaned[: self.settings.max_response_chars],
                        sources=[],
                        mode="llm",
                        remaining_questions=remaining_after,
                        suggested_questions=self._suggestions(exclude=text),
                    )
                return
            except Exception:
                pass  # 降级到 retrieval

        # Retrieval fallback
        excerpts = []
        for s in scored[:3]:
            body = s.chunk.summary or s.chunk.body[:280]
            excerpts.append(f"【{s.chunk.title}】{body}")
        answer = (
            "当前 AI 生成暂不可用或未配置模型。根据已审核资料摘录如下：\n\n"
            + "\n\n".join(excerpts)
            + "\n\n如需完整简历，请在招聘平台下载；如需进一步确认，请联系本人。"
        )
        yield ChatResponse(
            answer=answer[: self.settings.max_response_chars],
            sources=sources,
            mode="retrieval",
            remaining_questions=remaining_after,
            suggested_questions=self._suggestions(exclude=text),
        )

    def _is_sensitive(self, text: str) -> bool:
        for pattern in SENSITIVE_PATTERNS:
            if re.search(pattern, text, flags=re.IGNORECASE):
                return True
        return False

    def _is_refusal(self, text: str) -> bool:
        """判断 LLM 回答是否为自行拒答（资料不足）。"""
        return any(sig in text for sig in REFUSAL_SIGNALS)

    def _strip_source_refs(self, text: str) -> str:
        """剥离 LLM 回答末尾的来源引用行（不向面试官暴露出处）。
        匹配 (来源: ...) / （来源：...）/ (参考: ...) 等尾随引用，并清理多余空行。
        """
        # 移除形如 (来源: xxx) 或 （来源：xxx） 的括号引用块（含中英文括号/冒号）
        cleaned = re.sub(r"[（(]\s*(来源|参考|引用)\s*[:：][^）)]*[）)]", "", text, flags=re.IGNORECASE)
        # 移除独立的 "来源: xxx" 行
        cleaned = re.sub(r"(?m)^\s*(来源|参考|引用)\s*[:：].*$", "", cleaned, flags=re.IGNORECASE)
        # 清理末尾多余空行
        return cleaned.rstrip() + "\n" if cleaned.rstrip() else cleaned

    def _validate_llm_answer(self, raw: str, sources: list[SourceRef]) -> str | None:
        """校验 LLM 回答。返回 None 表示通过，返回 str 表示替换为该拒答文案。"""
        # LLM 自行拒答 -> 尊重它，统一文案
        if self._is_refusal(raw):
            return REFUSAL_ANSWER
        # 通过：不再要求来源引用，拒答防线由检索阈值 + SYSTEM_PROMPT 约束保证
        return None

    def _suggestions(self, exclude: str) -> list[str]:
        out = [q for q in DEFAULT_SUGGESTIONS if q not in exclude]
        return out[:3]
