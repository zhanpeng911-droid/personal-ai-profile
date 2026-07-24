---
id: skill-python
kind: skill
visibility: hr
verified: true
updated_at: 2026-07-22
keywords: [Python, AsyncIO, FastAPI, Pydantic, Pytest, Typer, LangChain, 异步, 测试]
summary: Python 异步编程、Web 框架、测试与工程实践能力，基于两个独立项目的实际应用。
---

# Python 工程能力

## 异步编程

- **AsyncIO 状态机**（NovaMind）：自研异步状态机引擎，三协程并发（user_input_loop / agent_worker / pacemaker_loop），EventBus 队列通信，`asyncio.to_thread` 隔离同步 IO
- **异步检索**（Notebook）：`asyncio.gather` 并行检索知识库与笔记库，`asyncio.wait_for` 控制 LLM 调用超时（30s）
- 理解事件循环、协程调度、竞态条件规避（心跳与用户输入共享队列设计）

## Web 框架

- **FastAPI**（Notebook 主服务）：Router-Service-Repository 分层，Pydantic v2 校验，SSE StreamingResponse，依赖注入（Depends），lifespan 异步上下文
- **Django**（Notebook 用户服务）：DRF + JWT 认证，独立用户/文件模块，drf-yasg Swagger

## 测试

- **Pytest**：NovaMind 114 passed（85 单元 + 14 Agent Eval + 15 集成）；Notebook 235 passed
- **Agent Eval**：行为级评估框架（单轮/多轮对话、工具调用收敛、记忆裁剪、会话隔离、安全拒绝）
- **Playwright E2E**：Notebook 前端 39 passed（mock 模式）
- 测试覆盖：导入烟雾、文件校验、用户隔离、权限、限流、安全、Agentic RAG 回归

## 工程实践

- Pydantic v2 数据校验与配置管理（pydantic-settings）
- Typer CLI 开发（NovaMind config/run/monitor/doctor 四命令）
- 中间件管道模式（洋葱模型，计时/日志/限流可插拔）
- 线程安全（threading.Lock 用于 SQLite 持久化、TokenTracker、任务存储）
- 原子写（写 .tmp 后 os.replace）
