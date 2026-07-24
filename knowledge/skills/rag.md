---
id: skill-rag
kind: skill
visibility: hr
verified: true
updated_at: 2026-07-22
keywords: [RAG, Agentic RAG, 检索, Evidence Grader, Citation, ChromaDB, BM25, HyDE, SSE, 评测]
summary: RAG 系统设计与可信回答能力，从朴素 RAG 到 Agentic RAG 的完整工程实践。
---

# RAG 工程能力

## Agentic RAG 流水线（Notebook）

完整 Planner -> Retrieval -> Evidence Grader -> Query Rewrite -> Answer Generator -> Citation 流水线：

- **Planner**：规则引擎分类 QueryType（factual/explanatory/comparative/procedural/exploratory），映射检索策略（scope/top_k/use_hyde/use_rerank），避免额外 LLM 调用
- **统一检索**：知识库+笔记库并行检索（asyncio.gather），混合检索（向量+BM25 EnsembleRetriever），动态权重
- **Evidence Grader**：规则引擎评估，confidence = avg_score*0.7 + coverage*0.3，阈值 0.4，第二轮放宽避免无限重试
- **Query Rewrite**：证据不足时改写查询，最多 2 轮
- **Citation Manager**：引用归一化，source_type + source_id + index 可追溯映射

## 混合检索

- 向量检索（ChromaDB）+ BM25 组合，EnsembleRetriever 动态权重
- 长查询向量权重高，短查询 BM25 权重高
- HyDE 假设文档生成增强检索
- DashScope gte-rerank 重排序精排（无 Key 降级）

## 向量存储

- ChromaDB 轻量向量库，双重检查锁定单例避免连接池冲突
- 用户隔离：所有查询带 `filter={"user_id": ...}`
- 笔记独立 collection，额外 doc_type=note 过滤

## 异步文档索引

- 上传与索引解耦：先持久化文件 + MySQL 建记录，再异步索引
- 6 状态机：uploaded -> parsed -> pending_index -> indexing -> indexed / index_failed
- Celery 任务 max_retries=3，Beat 每 5 分钟补偿 pending + failed 文档
- embedding 不可用降级 MySQL LIKE 关键词搜索

## 可信回答

- 只基于证据回答，不编造，证据不足明确说明
- 引用用 [数字] 格式，可追溯到具体文档
- Guardrails 防 Prompt Injection（正则移除危险模式）
- SSE 流式返回全过程（10 个阶段事件）

## 评测体系

- 4 类用例：rag_retrieval / agent_tool / safety / answer_quality
- 6 个评分器：keyword / tool_call / forbidden_content / retrieval / answer_quality / schema_validator
- 4 种模式：dry-run / mock / llm-smoke / real
