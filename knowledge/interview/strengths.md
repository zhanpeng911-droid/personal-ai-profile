---
id: interview-strengths
kind: interview
visibility: hr
verified: true
updated_at: 2026-07-22
keywords: [优势, Agent, RAG, 异步, 可审计, 成本控制, 测试, 安全, 全栈]
summary: 基于两个独立项目实际代码经验的能力优势，附测试基线数据。
---

# 核心优势

## Agent 运行时工程能力

- **自研异步状态机**：NovaMind 替代 LangGraph，Node+Edge 有向图 + 条件路由 + max_iterations 防死循环，Agent 级状态跨调用保持
- **三协程并发架构**：user_input_loop/agent_worker/pacemaker_loop 通过 EventBus 队列通信，心跳与用户输入共享队列避免竞态
- **多 Provider 适配**：ProviderFactory 统一 OpenAI/Anthropic/Ollama/OpenAI 兼容，按 provider:model 缓存
- **MCP 协议支持**：stdio 通信，JSON-RPC 2.0 握手，工具名加前缀，15s 读超时

## RAG 工程能力

- **Agentic RAG 流水线**：Notebook 实现 Planner->Retrieval->Evidence Grader->Query Rewrite->Answer->Citation 完整链路
- **混合检索**：向量+BM25 EnsembleRetriever，动态权重（长查询向量高，短查询 BM25 高），HyDE 增强，gte-rerank 精排
- **引用溯源**：Citation Manager 通过 source_type+source_id+index 建立可追溯映射
- **防无限循环**：三道闸（max_rounds=2 + 45s 超时 + 第二轮放宽）

## 安全与零信任

- **沙箱路径穿越防护**：os.path.commonpath 而非前缀匹配（NovaMind sandbox_tools.py:42）
- **受控 Shell**：元字符正则拦截 + 命令白名单
- **AST 安全计算器**：替代 eval，_SAFE_OPERATORS 白名单
- **策略层权限**：12 工具白名单 + confirmation_keywords 确认机制
- **Prompt Injection 防护**：Guardrails 正则移除 7 种危险模式

## 可观测性与成本治理

- **JSONL 审计**：9 类事件，单例异步 logger，脱敏机制
- **Token 成本追踪**：MODEL_PRICING 定价表，$5 预警，多 provider usage 兜底
- **降级设计**：embedding 不可用降级 MySQL LIKE；LLM 不可用降级资料摘录；无模型时 FAQ 仍可用
- **Beat 补偿**：每 5 分钟扫描 pending+failed 文档补偿索引

## 全栈与工程实践

- **全栈能力**：Vue 3 + FastAPI + Django + Docker Compose 多服务部署
- **用户/空间隔离**：JWT + user_id + space_id 三层隔离
- **测试基线**：NovaMind 114 passed（含 Agent Eval）；Notebook 286 passed（含 AgentEval + Playwright E2E）
- **存储选型**：SQLite（单机记忆）、ChromaDB（向量检索）、MySQL+Redis（用户服务/缓存/队列）
