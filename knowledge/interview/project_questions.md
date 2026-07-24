---
id: interview-project-questions
kind: interview
visibility: hr
verified: true
updated_at: 2026-07-22
keywords: [面试问题, NovaMind, Notebook, 技术深度, 架构决策, 状态机, Agentic RAG, 隔离, 索引]
summary: 基于简历与真实代码库交叉验证的面试问题，覆盖技术深度与架构决策，附代码证据。
---

# 项目面试问题

## NovaMind 项目

### 技术深度验证

**自研异步状态机**
- 状态机条件路由如何实现？route(state) 取 messages[-1]，若是 AIMessage 且有 tool_calls 返回 "tools"，否则 "__end__"，形成 agent↔tools 循环（agent.py:81-94）
- 如何防止无限循环？max_iterations=50 硬限制（state_machine.py:395）
- Agent 级状态如何跨调用保持？_states[thread_id] 字典，astream 结束后才持久化（state_machine.py:311）

**三协程并发**
- 为什么心跳和用户输入共享同一队列？避免竞态，agent_worker 统一消费（main.py:208 注释）
- pacemaker_loop 作用？每 10 秒检查 tasks.json 定时任务，到期注入队列（main.py:322）
- asyncio.to_thread 解决什么？隔离 LangChain 同步 IO 调用，不阻塞事件循环（agent.py:236）

**零信任沙箱**
- 路径穿越防护为什么用 commonpath 而非前缀匹配？前缀匹配可被 `../` 绕过，commonpath 从根本杜绝（sandbox_tools.py:42）
- Shell 白名单有哪些命令？pwd/echo/ls/dir/cat/type/mkdir，cat 单次最多 5 文件
- AST 计算器如何防注入？_SAFE_OPERATORS 仅允许算术运算，拒绝函数调用/属性访问/变量引用

**分层记忆**
- 三层分别存什么？短期=内存 messages；中期=SQLite summaries 表 + LLM 摘要；长期=user_profile.md
- 用户画像为什么标注"不可信"？防止画像内容被当作指令执行造成越权（context.py:326）
- 回合级裁剪参数？trigger=40/keep=10，超阈值保留近 10 轮

**审计与成本**
- JSONL 记录哪 9 类事件？llm_input/context_pack_loaded/policy_check/policy_violation/tool_call/tool_result/token_usage/ai_message/system_action
- Token 追踪如何跨 Provider？优先 usage_metadata，回退 response_metadata.token_usage
- 成本预警阈值？累计 $5.0 打印警告

### 架构决策

- 为什么自研状态机替代 LangGraph？v2.0.0 重大变更，获得条件路由+循环限制完全控制，减少重型依赖
- 为什么用 SQLite 而非 Redis 做记忆？单机部署优先，无外部依赖，threading.Lock 线程安全
- 中间件管道为什么用洋葱模型？请求外到内、响应内到外，计时/日志/限流可插拔

---

## Notebook 项目

### 技术深度验证

**Agentic RAG 流水线**
- Planner 如何决定检索策略？规则引擎按关键词分类 QueryType，映射 scope/top_k/use_hyde/use_rerank（planner.py:98-122）
- Evidence Grader 评分标准？confidence = avg_score*0.7 + coverage*0.3，阈值 0.4，第二轮放宽（retrieval_grader.py:87）
- Query Rewrite 触发条件？grading.is_sufficient==False 且 can_retry()，最多 2 轮
- 答案生成为什么用原始 query 而非改写后 query？避免改写引入偏差（graph.py:153 注释）

**混合检索**
- 动态权重如何计算？长查询(>50字)向量0.7/BM25 0.3；短查询(<20字)向量0.3/BM25 0.7
- HyDE 如何增强检索？用 LangChain 链生成假设文档再检索
- rerank 用什么模型？DashScope gte-rerank，无 Key 降级返回原始文档

**SSE 流式**
- 10 个事件阶段？started->planning->retrieving->retrieval_completed->grading_evidence->rewriting_query->generating_answer->citation->completed/error
- 限流？10 次/60s

**文档索引**
- 6 状态机？uploaded->parsed->pending_index->indexing->indexed/index_failed
- Celery 任务重试策略？max_retries=3, default_retry_delay=60
- Beat 补偿？每 5 分钟扫描 pending + failed(retry_count<3)，每次最多 10 个
- embedding 不可用如何降级？上传仍保存（pending_index），检索降级 MySQL LIKE

**用户/空间隔离**
- 三层隔离？JWT 提取 user_id -> 检索层 filter user_id -> DB 层 and user_id
- 空间隔离？space_id 可空，非空时 _ensure_space_member 校验组织成员

### 架构决策

- 为什么 Planner 和 Evidence Grader 用规则引擎而非 LLM？避免额外模型调用，降低成本与延迟
- 为什么 Django 独立用户服务？职责分离，用户管理成熟，JWT+黑名单完善
- 为什么选 ChromaDB？轻量易部署，双重检查锁定单例避免连接池冲突

---

## 综合问题（跨项目）

**技术栈选择**
- 两个项目都用 LangChain，遇到过哪些坑？多 provider usage 字段差异需兜底提取；LangChain 同步 IO 需 asyncio.to_thread 隔离
- NovaMind 用 asyncio，Notebook 用 Celery，为什么不同？NovaMind 是终端交互实时响应用协程；Notebook 是 Web 服务长任务（文档索引）用 Celery 任务队列

**工程实践**
- 测试基线？NovaMind 114 passed（85 单元+14 Agent Eval+15 集成）；Notebook 286 passed（235 Pytest+12 Django+39 Playwright）
- 如何保证代码质量？Agent Eval 行为级评估 + 回归测试 + doctor 自检

**挑战与收获**
- 最大技术挑战？NovaMind 自研状态机替代 LangGraph 的条件路由设计；Notebook Agentic RAG 防无限循环的三道闸设计
- 如果重新设计会做什么不同？考虑流式输出更早接入 NovaMind；Notebook 考虑用 LangGraph 编排（但有自研引擎经验后倾向自研）
