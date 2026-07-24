---
id: project-notebook
kind: project
project: Notebook
visibility: hr
verified: true
updated_at: 2026-07-22
keywords: [Notebook, Vue 3, FastAPI, LangChain, Django, ChromaDB, Celery, RAG, SSE, Agentic RAG, Evidence Grader, Citation, MySQL, Redis, JWT, Playwright]
summary: Agentic RAG 智能知识工作台：Planner->Retrieval->Evidence Grader->Query Rewrite->Answer Generator->Citation 流水线，支持多模型、SSE 流式、异步索引与用户/空间隔离。本地全量回归 286 passed。
---

# Notebook 智能知识工作台（Agentic RAG）

## 项目链接

github.com/zhanpeng911-droid/RAG-Notebook

## 解决的问题

传统 RAG"固定检索后直接生成、索引不可观测、业务链路难验证"。Notebook 面向长期知识沉淀、多用户使用与连续写作场景，独立完成全栈开发，将笔记、文档、索引、回顾与 AI 问答整合为可追溯、可引用、可恢复的个人知识工作流。

## 技术栈

Vue 3、FastAPI、Django、LangChain、MySQL、Redis、Celery、ChromaDB、JWT、Playwright、Pytest

## 个人职责

- 独立完成全栈开发（前端 Vue 3 + 后端 FastAPI + Django 用户服务）
- 设计 Agentic RAG 流水线（Planner -> RetrievalService -> Evidence Grader -> Query Rewrite -> Answer Generator -> Citation Manager + Guardrails）
- 实现多模型统一接口（Ollama / DashScope / OpenAI 兼容）
- 构建 SSE 流式输出与连接生命周期管理
- 设计 Celery 异步文档索引任务队列 + Beat 补偿机制
- 实现用户/空间隔离（JWT + user_id + space_id 三层隔离）
- 补齐 AgentEval、文件校验、权限隔离、限流与 Playwright mock E2E / Pytest 回归测试

## 架构与技术

### Agentic RAG 流水线（核心）

文件 backend/app/agentic/，`AgentGraph.run()` 以 AsyncGenerator 产出 SSE 事件：

1. **Guardrails**（guardrails.py）：输入校验（user_id/space_id 格式）、sanitize_query 防 Prompt Injection（正则移除 `ignore previous instructions`/`system:`/`<|system|>` 等 7 种模式）、总超时 45s
2. **Planner**（planner.py）：**规则引擎分类（非 LLM）**，按关键词判断 QueryType（factual/explanatory/comparative/procedural/exploratory），映射检索策略（scope/top_k/use_hyde/use_rerank）
3. **RetrievalService**（retrieval_service.py）：统一检索知识库+笔记库，`asyncio.gather` 并行，HyDE 假设文档生成，混合检索（向量+BM25），去重与相邻切片合并
4. **Evidence Grader**（retrieval_grader.py）：**规则引擎评估（非 LLM）**，阈值 MIN_RELEVANCE_SCORE=0.3 / MIN_CONFIDENCE=0.4，confidence = avg_score*0.7 + coverage*0.3
5. **Query Rewrite**（planner.py:143）：证据不足时改写查询（移除引号、截断超长），最多 2 轮检索
6. **Answer Generator**（answer_generator.py）：基于证据生成回答，30s 超时，引用用 [数字] 格式
7. **Citation Manager**（citation.py）：引用归一化，通过 source_type + source_id + index 建立可追溯映射

### Planner 检索策略映射

| QueryType | scope | top_k | use_hyde | use_rerank |
|-----------|-------|-------|----------|------------|
| FACTUAL | all | 5 | True | True |
| EXPLANATORY | all | 8 | True | True |
| COMPARATIVE | all | 10 | True | True |
| PROCEDURAL | knowledge | 5 | False | True |
| EXPLORATORY | all | 8 | True | True |

- 传入 space_id 时 scope 强制改写为 `space:{space_id}`
- 第二轮降 top_k：`max(3, top_k - 2)`

### Evidence Grader 评分

- 无证据 -> is_sufficient=False, confidence=0.0
- 过滤 score >= 0.3 的相关证据，全过滤掉 -> confidence=0.1
- confidence = 平均相关性 * 0.7 + (相关证据数/总证据数) * 0.3
- 充分判定：相关证据 >= 1 且 confidence >= 0.4
- **第二轮放宽**：retrieval_round > 0 且有相关证据 -> 直接 sufficient（避免无限重试）

### 防止 Agent 无限循环（三道闸）

1. `max_retrieval_rounds=2`（state.py:52，can_retry 判断）
2. `MAX_TOTAL_TIME=45s`（guardrails.py:21，check_timeout）
3. Evidence Grader 第二轮放宽（retrieval_grader.py:87）

### 混合检索（Hybrid Retrieval）

`HybridRetriever` 组合向量检索 + BM25：

- `EnsembleRetriever(retrievers=[vector, bm25], weights=weights)`
- 动态权重：长查询(>50字) 向量0.7/BM25 0.3；短查询(<20字) 向量0.3/BM25 0.7；中等各0.5
- 无 user_id 返回 EmptyRetriever（空结果防护）

### ReorderService 重排序

用 DashScope `gte-rerank` 模型精排，无 API Key 或异常时返回原始文档降级。

### SSE 流式输出

10 个事件阶段（AgentPhase 枚举）：

`started` -> `planning` -> `retrieving` -> `retrieval_completed` -> `grading_evidence` -> `rewriting_query` -> `generating_answer` -> `citation` -> `completed` / `error`

端点 `POST /chat/agent/query/stream`，`StreamingResponse(media_type="text/event-stream")`，限流 10次/60s。

### 文档索引状态机

6 状态：`uploaded` -> `parsed` -> `pending_index` -> `indexing` -> `indexed` / `index_failed`

- 上传与索引解耦：先安全持久化文件 + MySQL 建记录，再异步索引
- 立即尝试同步索引，失败则提交 Celery 任务，返回 pending_index
- Celery 任务 `max_retries=3, default_retry_delay=60`，异常信息脱敏（移除 sk-xxx/Bearer）
- Celery Beat 每 5 分钟扫描 pending + failed(retry_count<3) 文档补偿索引
- 用户可手动 `POST /{id}/reindex` 重试

### embedding 不可用降级

- 上传仍保存文件（状态 pending_index）
- 检索降级 MySQL LIKE 关键词搜索（只查 INDEXED 状态，score=0.5）
- embedding 恢复后由 Beat 补偿索引

### 用户/空间隔离（三层）

1. **JWT 层**：Django 签发（HS256，24h 过期，jti 黑名单），FastAPI `get_current_user_id` 提取 user_id
2. **检索层**：RetrievalService 构造器强制 user_id，所有 Chroma 查询带 `filter={"user_id": ...}`；笔记库额外 `_user_note_filter` 加 doc_type=note
3. **数据层**：DocumentIndex/Note/AgentRun 表都有 user_id 列且建索引，repository 查询全部 `and_(...user_id == user_id)`

空间隔离：space_id 可空（空=个人知识库），非空时 `_ensure_space_member` 校验用户是空间所属组织成员。

### 服务拆分

三个服务：`front/`（Vue 3 + Vite）、`backend/`（FastAPI + LangChain）、`DjangoUserService/`（Django 用户服务）

- 用户认证独立 Django（职责分离，用户管理成熟，JWT 签发+黑名单）
- FastAPI 用 JWT 识别用户（共享 secret，30s 时钟偏移）
- Docker Compose 编排 7 个服务（mysql/redis/backend/celery-worker/celery-beat/django/frontend）

### 交付功能

笔记 CRUD、文档上传/索引、知识库问答、Agent SSE 对话、写作辅助（续写/扩写/摘要）、艾宾浩斯间隔回顾（INTERVALS=[1,2,4,7,15,30] 天）

## 难点与取舍

- **Django vs FastAPI 用户服务**：独立 Django 应用（职责分离，用户管理成熟，JWT+黑名单完善）
- **ChromaDB vs Milvus/Pinecone**：轻量易部署，适合中小规模知识库，双重检查锁定单例避免连接池冲突
- **Celery 异步索引**：避免大文档阻塞主线程，支持重试与 Beat 补偿
- **SSE vs WebSocket**：单向流式输出足够，更简单轻量
- **规则引擎 vs LLM 做规划/评分**：Planner 和 Evidence Grader 用规则引擎，避免额外模型调用，降低成本与延迟
- **答案生成用原始 query 而非改写后 query**：避免改写引入偏差

## 成果

- 完整 Agentic RAG 系统，支持 Planner 动态决定检索策略、Evidence Grader 评分筛选、Query Rewrite 重试、Citation Manager 引用溯源
- 用户/空间隔离，支持多租户
- 反馈循环机制（AgentFeedback 评分 1-5）
- 本地全量回归 **286 passed, 0 failed, 6 skipped**：
  - 后端 Pytest 235 passed（含 AgentEval）
  - Django 用户/文件 12 passed
  - 前端 Playwright mock E2E 39 passed
  - 6 skipped 是 Windows 上 python-magic 可能 segfault 的 MIME 用例

## 可追问话题

- Agentic RAG 和传统 RAG 的区别？Planner 如何决定检索策略？
- Evidence Grader 评分标准？为什么第二轮放宽？
- 如何避免 Agent 无限循环？三道闸分别是什么？
- SSE 事件有哪些阶段？连接中断如何处理？
- 文档索引状态机有哪些状态？失败如何补偿？
- 用户/空间隔离三层分别在哪实现？
- embedding 不可用时系统如何降级？
- 混合检索的动态权重如何计算？
- 为什么 Planner 和 Evidence Grader 用规则引擎而非 LLM？
