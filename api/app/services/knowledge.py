from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml


FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n(.*)$", re.DOTALL)


@dataclass
class KnowledgeChunk:
    id: str
    kind: str
    title: str
    summary: str
    keywords: list[str]
    body: str
    path: str
    project: str | None = None
    slug: str | None = None
    sections: list[dict[str, str]] = field(default_factory=list)


@dataclass
class FaqItem:
    question: str
    answer: str
    source_id: str = "interview-faq"


class KnowledgeBase:
    def __init__(self) -> None:
        self.chunks: list[KnowledgeChunk] = []
        self.faq_items: list[FaqItem] = []
        self.root: Path | None = None

    def load(self, root: Path) -> None:
        self.root = root
        self.chunks = []
        self.faq_items = []
        if not root.exists():
            return

        manifest_path = root / "manifest.json"
        paths: list[Path]
        if manifest_path.exists():
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            paths = [root / item["path"] for item in manifest.get("documents", [])]
        else:
            paths = sorted(root.rglob("*.md"))

        for path in paths:
            if not path.exists():
                continue
            text = path.read_text(encoding="utf-8")
            meta, body = parse_frontmatter(text)
            if not meta.get("verified"):
                continue
            if meta.get("visibility") != "hr":
                continue
            doc_id = str(meta.get("id") or path.stem)
            title = first_heading(body) or doc_id
            keywords = meta.get("keywords") or []
            if isinstance(keywords, str):
                keywords = [keywords]
            chunk = KnowledgeChunk(
                id=doc_id,
                kind=str(meta.get("kind") or "doc"),
                title=title,
                summary=str(meta.get("summary") or ""),
                keywords=[str(k) for k in keywords],
                body=body.strip(),
                path=str(path.relative_to(root)).replace("\\", "/"),
                project=meta.get("project"),
                slug=meta.get("slug"),
                sections=split_sections(body),
            )
            self.chunks.append(chunk)
            if chunk.kind == "faq" or "faq" in path.name.lower():
                self.faq_items.extend(parse_faq_items(body, source_id=doc_id))

    def public_projects(self) -> list[KnowledgeChunk]:
        return [c for c in self.chunks if c.kind == "project"]

    def get(self, doc_id: str) -> KnowledgeChunk | None:
        for c in self.chunks:
            if c.id == doc_id:
                return c
        return None


def parse_frontmatter(text: str) -> tuple[dict[str, Any], str]:
    match = FRONTMATTER_RE.match(text.strip())
    if not match:
        return {}, text
    meta_raw, body = match.group(1), match.group(2)
    meta = yaml.safe_load(meta_raw) or {}
    if not isinstance(meta, dict):
        meta = {}
    return meta, body


def first_heading(body: str) -> str | None:
    for line in body.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return None


def split_sections(body: str) -> list[dict[str, str]]:
    sections: list[dict[str, str]] = []
    current_title = "概述"
    current_lines: list[str] = []
    for line in body.splitlines():
        if line.startswith("## "):
            if current_lines:
                sections.append({"title": current_title, "body": "\n".join(current_lines).strip()})
            current_title = line[3:].strip()
            current_lines = []
        else:
            current_lines.append(line)
    if current_lines:
        sections.append({"title": current_title, "body": "\n".join(current_lines).strip()})
    return [s for s in sections if s["body"]]


def parse_faq_items(body: str, source_id: str) -> list[FaqItem]:
    items: list[FaqItem] = []
    question: str | None = None
    answer_lines: list[str] = []
    for line in body.splitlines():
        stripped = line.strip()
        if stripped.startswith("## Q:") or stripped.startswith("## Q："):
            if question and answer_lines:
                items.append(
                    FaqItem(
                        question=question,
                        answer="\n".join(answer_lines).strip(),
                        source_id=source_id,
                    )
                )
            question = stripped.split(":", 1)[-1].split("：", 1)[-1].strip()
            answer_lines = []
        elif stripped.startswith("A:") or stripped.startswith("A："):
            answer_lines.append(stripped.split(":", 1)[-1].split("：", 1)[-1].strip())
        elif question is not None:
            if stripped:
                answer_lines.append(stripped)
    if question and answer_lines:
        items.append(
            FaqItem(
                question=question,
                answer="\n".join(answer_lines).strip(),
                source_id=source_id,
            )
        )
    return items


knowledge_base = KnowledgeBase()
