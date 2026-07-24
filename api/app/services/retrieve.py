from __future__ import annotations

import re
from dataclasses import dataclass

from app.services.knowledge import KnowledgeChunk


TOKEN_RE = re.compile(r"[\u4e00-\u9fff]|[A-Za-z0-9_]+")


def tokenize(text: str) -> list[str]:
    tokens: list[str] = []
    for match in TOKEN_RE.finditer(text.lower()):
        tok = match.group(0)
        if len(tok) == 1 and "\u4e00" <= tok <= "\u9fff":
            tokens.append(tok)
        elif len(tok) > 1:
            tokens.append(tok)
            # also keep CJK bigrams from continuous Chinese runs handled elsewhere
    # Chinese bigrams for better matching
    chars = [c for c in text if "\u4e00" <= c <= "\u9fff"]
    for i in range(len(chars) - 1):
        tokens.append(chars[i] + chars[i + 1])
    return tokens


@dataclass
class ScoredChunk:
    chunk: KnowledgeChunk
    score: float
    anchor: str | None = None


def score_chunk(query_tokens: set[str], chunk: KnowledgeChunk) -> ScoredChunk:
    hay = " ".join(
        [
            chunk.title,
            chunk.summary,
            " ".join(chunk.keywords),
            chunk.body[:2000],
        ]
    ).lower()
    hay_tokens = set(tokenize(hay))
    if not query_tokens:
        return ScoredChunk(chunk=chunk, score=0.0)

    overlap = query_tokens & hay_tokens
    base = len(overlap) / max(len(query_tokens), 1)

    title_tokens = set(tokenize(chunk.title))
    kw_tokens = set(tokenize(" ".join(chunk.keywords)))
    title_boost = 0.25 * (len(query_tokens & title_tokens) / max(len(query_tokens), 1))
    kw_boost = 0.35 * (len(query_tokens & kw_tokens) / max(len(query_tokens), 1))

    # section hit for anchor
    anchor = None
    best_section = 0.0
    for section in chunk.sections:
        sec_tokens = set(tokenize(section["title"] + " " + section["body"][:800]))
        sec_score = len(query_tokens & sec_tokens) / max(len(query_tokens), 1)
        if sec_score > best_section:
            best_section = sec_score
            anchor = section["title"]

    score = base + title_boost + kw_boost + 0.15 * best_section
    return ScoredChunk(chunk=chunk, score=score, anchor=anchor)


def retrieve(query: str, chunks: list[KnowledgeChunk], top_k: int = 5, min_score: float = 0.12) -> list[ScoredChunk]:
    q_tokens = set(tokenize(query))
    scored = [score_chunk(q_tokens, c) for c in chunks]
    scored.sort(key=lambda s: s.score, reverse=True)
    return [s for s in scored if s.score >= min_score][:top_k]


def faq_match(query: str, items: list, threshold: float = 0.45):
    q_tokens = set(tokenize(query))
    best = None
    best_score = 0.0
    for item in items:
        tokens = set(tokenize(item.question))
        if not tokens:
            continue
        score = len(q_tokens & tokens) / max(len(q_tokens | tokens), 1)
        # also reward query subset of question
        if q_tokens and q_tokens.issubset(tokens):
            score = max(score, 0.7)
        if score > best_score:
            best_score = score
            best = item
    if best is None or best_score < threshold:
        return None, 0.0
    return best, best_score
