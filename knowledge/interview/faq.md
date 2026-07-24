---
id: interview-faq
kind: faq
visibility: hr
verified: true
updated_at: 2026-07-22
keywords: [FAQ, 常见问题, 彭展玮, NovaMind, Notebook, Agent, RAG, 求职, 教育, 测试]
summary: 审核过的精选问答，覆盖求职方向、教育背景、项目细节、技术栈与测试基线。
---

# 精选 FAQ

## Q: 你的求职方向是什么？
A: 正在寻找 AI Agent / RAG 应用开发方向的实习机会，目标岗位包括 AI Agent 工程师、LLM 应用工程师、RAG/知识库系统工程师、偏 AI 应用的后端工程师。关注可信检索、上下文工程、可观测性与低成本可上线方案。

## Q: 你叫什么名字？教育背景是什么？
A: 我叫彭展玮，珠海科技学院通信工程本科在读（2023/09–2027/07）。持有 CET-4、全国计算机等级考试二级、数学建模竞赛省级三等奖。通信工程背景为信号处理与算法仿真提供数学基础，自学转向 AI Agent 与 RAG 应用工程方向。

## Q: 完整简历在哪里下载？
A: 本站不提供简历 PDF 下载。请在招聘平台（Boss 直聘、智联、猎聘等）查看并下载完整简历；本站侧重项目证据与 AI 可追问分身。

## Q: AI 分身的回答可信吗？
A: AI 只基于人工审核且标记为可公开的资料回答；资料不足会明确拒答，不编造个人事实。回答附带来源引用，可追溯到具体文档。

## Q: 为什么需要邀请码？
A: 控制 LLM 调用成本与滥用风险，同时限制未授权高频提问。日配额 30 次，输入限制 800 字符。

## Q: 你有哪些独立项目？
A: 两个独立开发的项目：Notebook 智能知识工作台（2026.3 至今，Vue 3+FastAPI+Django+LangChain 全栈 Agentic RAG，286 passed）和 NovaMind 透明可控 AI 智能体框架（2026.5–2026.6，自研异步状态机引擎，114 passed）。均在 GitHub 开源（github.com/zhanpeng911-droid）。

## Q: NovaMind 项目的核心架构是什么？
A: NovaMind 自研异步状态机引擎替代 LangGraph，基于 Node+Edge 有向图，条件路由判断 tool_calls 决定 agent↔tools 循环，max_iterations=50 防死循环。三协程并发（user_input_loop/agent_worker/pacemaker_loop）通过 EventBus 队列通信。具备零信任沙箱工具执行（路径穿越防护+Shell 白名单+AST 计算器）、分层记忆（短期内存/中期 SQLite 摘要/长期用户画像）、JSONL 审计日志（9 类事件）、Token 成本追踪。支持 OpenAI/Anthropic/Ollama 多模型与 MCP 适配器。

## Q: Notebook 项目的 Agentic RAG 流水线如何工作？
A: Notebook 实现 Planner->RetrievalService->Evidence Grader->Query Rewrite->Answer Generator->Citation Manager 流水线。Planner 用规则引擎分类问题类型决定检索策略；RetrievalService 混合检索（向量+BM25）并行查知识库与笔记库；Evidence Grader 规则评估证据充分性（confidence=avg_score*0.7+coverage*0.3，阈值0.4）；证据不足时 Query Rewrite 改写查询重检索（最多2轮）；Citation Manager 归一化引用。全程 SSE 流式返回 10 个阶段事件。支持 Celery 异步文档索引与 Beat 补偿。

## Q: 两个项目的测试基线是多少？
A: NovaMind 测试基线 114 passed（85 单元测试 + 14 Agent Eval + 15 集成测试），0 errors 0 failures。Notebook 本地全量回归 286 passed（后端 Pytest 235 含 Agent Eval + Django 用户/文件 12 + 前端 Playwright mock E2E 39），0 failed 6 skipped。

## Q: 你如何处理不同 LLM Provider 的 API 差异？
A: NovaMind 用 ProviderFactory 统一适配 OpenAI/Anthropic/Ollama/OpenAI 兼容接口（aliyun/tencent/z.ai），内置兼容 base_url 字典，按 provider:model 缓存 LLM 实例。Notebook 抽象多模型统一接口支持 Ollama/DashScope/OpenAI 兼容。模型不可用时降级到 FAQ 或资料摘录。

## Q: 你如何保证 Agent 不会无限循环？
A: NovaMind 状态机用 max_iterations=50 硬限制。Notebook Agentic RAG 用三道闸：max_retrieval_rounds=2 限制检索轮次、MAX_TOTAL_TIME=45s 总超时、Evidence Grader 第二轮放宽（有相关证据即 sufficient）避免无限重试。

## Q: 你擅长哪些技术栈？
A: Python（AsyncIO/FastAPI/Django/Pydantic/Typer）、LangChain、Vue 3、RAG、Agent Workflow、Context Engineering、SSE、ChromaDB、MySQL、Redis、Celery、Docker、JWT、Pytest、Playwright。细节可继续追问项目页。

## Q: 平时都用什么编程工具？
A: 主要使用 AI 编程工具：Codex、Claude Code、Cursor、Trae。已经不用传统 IDE 了，全面转向 AI 驱动的开发方式。这也是 NovaMind 项目设计的灵感来源--理解 Agent 如何辅助开发后，反过来构建 Agent 运行时框架。版本控制用 Git + GitHub，API 调试用 FastAPI Swagger，容器化用 Docker Compose。

## Q: NovaMind 的分层记忆是怎么做的？
A: 三层：短期记忆（内存 messages，跨调用保持）、中期记忆（SQLite summaries 表 + LLM 摘要，超 40 轮触发裁剪保留近 10 轮）、长期记忆（user_profile.md 文件，save_user_profile 工具覆写）。关键设计：摘要只记语境不记偏好，画像标注"不可信"防注入。

## Q: token 成本追踪功能怎么展现的？
A: TokenTracker 按 thread_id 聚合，MODEL_PRICING 定价表算成本，累计超 $5 预警。展现方式：JSONL 审计日志（token_usage 事件含 model/tokens/cost）、Rich 监控面板实时显示 in/out/total/cost、会话统计聚合、状态留存供分析。

## Q: 你设计这个项目的本意是什么？
A: NovaMind 解决现成 Agent 框架决策链路/成本/会话状态偏黑盒难调试的问题，核心目标是透明可审计。Notebook 解决传统 RAG 检索不准/索引不可观测/链路难验证的问题，核心是可追溯可引用的知识工作流。共性是"可信"--回答可追溯到证据，行为可审计，失败可降级。

## Q: 怎么衡量模型的能力？
A: NovaMind 有 14 条 Agent Eval（单轮/多轮对话、工具调用收敛、错误处理、记忆管理、会话隔离、安全拒绝）。Notebook 有 4 类用例 + 6 个评分器（keyword/tool_call/forbidden_content/retrieval/answer_quality/schema_validator）+ 4 种模式（dry-run/mock/llm-smoke/real）。衡量维度：召回率、准确率、安全性、一致性、成本效率。
