# 面试问题分析报告

基于简历声明与实际代码的交叉验证

---

## 一、NovaMind 项目

### 1.1 简历关键声明 vs 代码证据

| 简历声明 | 代码证据 | 验证状态 |
|---------|---------|---------|
| Python 3.10+ AI Agent 运行时 | pyproject.toml: python = ">=3.10" | ✅ 匹配 |
| 透明可审计零信任架构 | entry/monitor.py: Rich实时监控JSONL审计事件 | ✅ 匹配 |
| 异步状态机Agent循环 | entry/main.py: 3个并发协程(user_input_loop, agent_worker, pacemaker_loop) | ✅ 匹配 |
| 多Provider LLM支持 | pyproject.toml: langchain-openai, langchain-anthropic, anthropic, openai | ✅ 匹配 |
| 沙箱化工具执行与策略层 | README.md: "sandboxed tool execution with policy layer" | ✅ 匹配 |
| 动态技能发现与MCP适配器 | README.md: "dynamic skill discovery, MCP adapter" | ✅ 匹配 |
| 结构化上下文包(docs/) | README.md: "structured Context Pack from docs/" | ✅ 匹配 |
| 分层会话记忆(SQLite) | README.md: "layered session memory (SQLite)" | ✅ 匹配 |
| 成本追踪 | README.md: "cost tracking" + entry/monitor.py有TOKEN_USAGE事件 | ✅ 匹配 |
| CLI工具(config/run/monitor/doctor) | entry/cli.py: Typer CLI实现 | ✅ 匹配 |

### 1.2 面试问题

#### 技术深度验证

1. **状态机Agent循环**
   - Q: 请描述 `agent_worker` 协程中的状态转换逻辑。Agent在什么条件下会从"等待输入"状态转换到"执行工具"状态？
   - Q: 如何处理Agent执行过程中的异常？比如LLM调用失败或工具执行超时？

2. **审计与零信任**
   - Q: JSONL审计日志记录了哪些事件类型？为什么选择JSONL格式而不是数据库？
   - Q: 零信任架构在你的项目中具体如何实现？哪些环节需要验证？

3. **多Provider LLM**
   - Q: 如何处理不同LLM Provider的API差异（如Anthropic的tool_use vs OpenAI的function_call）？
   - Q: 如何实现Provider之间的故障转移（failover）？

#### 架构决策

4. **并发模型**
   - Q: 为什么选择3个独立协程而不是单一线程？`pacemaker_loop` 的作用是什么？
   - Q: asyncio在你的项目中解决了什么问题？有没有遇到过竞态条件？

5. **记忆系统**
   - Q: 分层会话记忆的具体分层策略是什么？短期/中期/长期记忆分别存储什么？
   - Q: SQLite作为记忆存储的优缺点？为什么不用Redis或向量数据库？

#### 实现细节

6. **工具沙箱**
   - Q: 工具执行的沙箱是如何实现的？如何防止恶意代码执行？
   - Q: 策略层如何控制工具的调用权限？

7. **技能发现**
   - Q: 动态技能发现的触发条件是什么？如何保证新发现的技能是安全的？

---

## 二、Notebook 项目

### 2.1 简历关键声明 vs 代码证据

| 简历声明 | 代码证据 | 验证状态 |
|---------|---------|---------|
| Vue 3 + FastAPI + LangChain + Django + MySQL + Redis + ChromaDB | docker-compose.yml: 全部服务 | ✅ 匹配 |
| Agentic RAG架构(Planner→Retriever→Evidence Grader→Citation Manager) | README.md: 完整流水线 | ✅ 匹配 |
| SSE流式输出 | backend/main.py: chat router | ✅ 匹配 |
| 异步文档索引(Celery) | docker-compose.yml: celery-worker, celery-beat | ✅ 匹配 |
| 用户/空间隔离 | README.md: "user/space isolation" | ✅ 匹配 |
| 支持Ollama/DashScope/OpenAI兼容 | README.md: "supports Ollama/DashScope/OpenAI-compat" | ✅ 匹配 |
| Django用户服务 | DjangoUserService/settings.py: Django 5.2.6 | ✅ 匹配 |
| 反馈循环 | README.md: "feedback loop" | ✅ 匹配 |

### 2.2 面试问题

#### 技术深度验证

1. **Agentic RAG流水线**
   - Q: 请详细描述Planner如何决定检索策略？在什么情况下会触发多跳检索（multi-hop retrieval）？
   - Q: Evidence Grader的评分标准是什么？如何处理低置信度的结果？
   - Q: Citation Manager如何保证引用的准确性？如何处理引用冲突？

2. **多模型支持**
   - Q: 如何统一Ollama、DashScope和OpenAI兼容接口的调用方式？
   - Q: 模型切换时如何保持会话上下文的连续性？

3. **SSE流式输出**
   - Q: SSE连接的生命周期管理（建立、保持、断开重连）如何实现？
   - Q: 如何处理SSE连接中断时的数据一致性？

#### 架构决策

4. **服务拆分**
   - Q: 为什么将用户服务独立为Django应用，而不是集成到FastAPI中？
   - Q: 如何处理跨服务的数据一致性（如用户删除后知识库的清理）？

5. **存储选型**
   - Q: ChromaDB在你的项目中承担什么角色？为什么选择ChromaDB而不是其他向量数据库（如Milvus、Pinecone）？
   - Q: MySQL和ChromaDB的数据如何保持同步？

#### 实现细节

6. **文档索引**
   - Q: Celery任务失败时的重试策略是什么？如何处理大文档的索引超时？
   - Q: 文档索引过程中如何处理格式解析错误（如损坏的PDF）？

7. **空间隔离**
   - Q: 空间隔离的实现粒度是什么？是数据库级别的隔离还是应用层过滤？
   - Q: 如何处理跨空间的查询需求？

---

## 三、综合问题（跨项目）

1. **技术栈选择**
   - Q: 两个项目都用到了LangChain，你在使用过程中遇到过哪些坑？如何解决的？
   - Q: NovaMind用asyncio，Notebook用Celery，为什么选择不同的并发方案？

2. **工程实践**
   - Q: 两个项目如何保证代码质量？有单元测试吗？覆盖率如何？
   - Q: 如何处理依赖冲突（如LangChain版本升级导致的breaking changes）？

3. **性能优化**
   - Q: 在NovaMind中，如何优化LLM调用延迟？有做过性能profiling吗？
   - Q: 在Notebook中，大文件索引时如何控制内存占用？

4. **挑战与收获**
   - Q: 这两个项目中你遇到的最大技术挑战是什么？如何解决的？
   - Q: 如果重新设计这两个项目，你会做出哪些不同的架构决策？

---

## 四、潜在风险点（面试官可能追问）

| 风险点 | 可能追问 |
|-------|---------|
| 零信任架构的具体实现 | "你能详细说明零信任在Agent运行时的具体实现吗？是mTLS、JWT还是其他机制？" |
| 策略层的实现 | "策略层的规则是如何定义和管理的？支持动态更新吗？" |
| MCP适配器 | "MCP协议的核心概念是什么？你的适配器如何处理MCP的capability协商？" |
| Evidence Grader | "评分算法是基于什么？规则引擎还是模型打分？如何处理边界情况？" |
| 空间隔离 | "数据库级别的隔离 vs 应用层过滤，各自的优缺点是什么？" |

---

*报告生成时间: 2026-07-22*
*基于简历与 NovaMind、Notebook 代码库*