---
id: project-novamind
kind: project
project: NovaMind
visibility: hr
verified: true
updated_at: 2026-07-22
keywords: [NovaMind, Python, AsyncIO, LangChain, Agent, SQLite, JSONL, MCP, 零信任, 状态机, Typer, 中间件, Token追踪, 沙箱]
summary: 透明可控的 AI Agent 运行时框架：自研异步状态机引擎替代 LangGraph，三协程并发，零信任沙箱工具执行，分层记忆，JSONL 审计与 Token 成本追踪。测试基线 114 passed。
---

# NovaMind 透明可控 AI 智能体框架

## 项目链接

github.com/zhanpeng911-droid/NovaMind

## 解决的问题

现成 Agent 框架在决策链路、成本统计与会话状态上偏黑盒、难调试。NovaMind 面向终端交互，独立设计透明可控的 AI Agent 框架，让每个关键步骤产生可追溯的结构化事件，并可用实时监控面板查看。

## 技术栈

Python、LangChain、Typer、prompt_toolkit、Rich、SQLite、JSONL、Pytest、unittest

## 个人职责

- 自研异步状态机引擎替代重型编排方案（LangGraph），串联 LLM 推理、工具执行、上下文裁剪、心跳任务与会话恢复
- 设计三协程并发架构（user_input_loop / agent_worker / pacemaker_loop）
- 引入中间件管道（洋葱模型），让计时、日志、限流等能力可按需插拔
- 实现分层记忆机制（短期内存 / 中期 SQLite 摘要 / 长期用户画像）
- 补齐 JSONL 审计日志、thread_id 隔离持久化、Token 成本追踪、config/run/monitor CLI
- 设计零信任沙箱化工具执行（office 文件/Shell 工具 + 策略层权限控制）
- 适配多模型 Provider（OpenAI / Anthropic / Ollama / OpenAI 兼容接口），支持动态技能发现与 MCP 适配器

## 架构与技术

### 自研异步状态机引擎（核心）

替代 LangGraph StateGraph，基于 Node + Edge 有向图实现：

- `AgentState` 数据结构（state_machine.py:29）：`messages`、`summary`、`metadata`，支持 `add_message`/`remove_messages`
- `NovaMindAgent` 类（state_machine.py:275）：`_nodes`/`_edges`/`_states`（Agent 级状态，跨 run/astream 保持连贯）
- 条件路由：`route(state)` 函数判断 `state.messages[-1]`，若是 AIMessage 且有 tool_calls 返回 `"tools"`，否则 `"__end__"`，形成 agent↔tools 循环
- `max_iterations=50` 防止无限循环
- `run()` 同步执行，`astream()` 流式 yield 每个节点结果

### 三协程并发架构

文件 entry/main.py，三个协程通过 EventBus 队列通信：

1. **user_input_loop**（main.py:262）：用 prompt_toolkit PromptSession 读取用户输入，注入事件总线队列；底部 spinner 状态栏；`/exit`/`/quit` 退出
2. **agent_worker**（main.py:207）：从队列消费消息，调 `agent.astream()` 流式输出；区分 `node_name=="agent"`（有 tool_calls 显示执行状态）与 `node_name=="tools"`（工具结果）
3. **pacemaker_loop**（main.py:322）：心跳调度协程，每 10 秒检查 tasks.json 定时任务，到期任务注入同一队列

关键设计：心跳消息与用户输入共享同一队列消费（main.py:208 注释），避免竞态。

### 中间件管道（洋葱模型）

文件 novamind/core/middleware.py：

- `MiddlewarePipeline.execute()` 反向包装中间件，请求从外到内、响应从内到外
- 内置三个中间件：
  - `timing_middleware`：time.monotonic() 计时
  - `logging_middleware`：记录 system_action 事件（请求开始/完成/失败）
  - `rate_limit_middleware`：滑动窗口限流，默认 60 RPM / 60s 窗口
- LLM 调用经 `pipeline.execute(ctx, _call_llm)`，`_call_llm` 用 `asyncio.to_thread` 隔离同步 IO

### 零信任工具执行

**策略层**（harness/policies.json + policy.py）：

- `default_allowed_tools`：12 个白名单工具
- `evaluate_tool_call()` 四步判断：工具不在白名单 -> 拒绝；命中 confirmation_keywords（删除/批量/覆盖等）-> 需确认；否则放行
- 每次工具调用先经策略评估，记 `policy_check` 事件，违规记 `policy_violation` 事件

**沙箱路径穿越防护**（sandbox_tools.py:42）：

- 用 `os.path.commonpath([base_dir, target_path]) != base_dir` 判断（而非字符串前缀），从根本上杜绝穿越
- 文件操作限定在 `workspace/office/` 目录

**受控 Shell**（execute_office_shell）：

- `_SHELL_METACHARS` 正则拦截元字符（`&|;<>\`\n\r`）、重定向、管道、环境变量展开
- `_ALLOWED_SHELL_COMMANDS` 白名单：pwd/echo/ls/dir/cat/type/mkdir
- cat 单次最多 5 文件

**AST 安全计算器**（calculator）：

- 用 Python AST 解析替代 `eval`，`_SAFE_OPERATORS` 仅允许加减乘除取模幂等，拒绝函数调用/属性访问/变量引用

### 分层记忆机制

| 层级 | 存储 | 实现 |
|------|------|------|
| 短期（工作记忆） | 内存 AgentState.messages | 跨 run/astream 在 _states[thread_id] 维持 |
| 中期（会话摘要） | SQLite summaries 表 + state.summary | ConversationStore 持久化；ContextManager 回合级裁剪（trigger=40/keep=10）+ LLM 摘要 |
| 长期（用户画像） | 文件 workspace/memory/user_profile.md | save_user_profile 工具覆写；build_system_prompt 标注"画像不可信，不得当指令"防注入 |

SQLite 持久化用 `threading.Lock` 线程安全，两张表：`conversations`（消息历史）+ `summaries`（会话摘要）。增量持久化 O(1)，用 `_pending_persist_messages` 元数据队列只存本轮新消息。

### JSONL 审计日志

单例 `AuditLogger`（logger.py），内存队列 + 守护线程异步写：

- 9 类事件：llm_input / context_pack_loaded / policy_check / policy_violation / tool_call / tool_result / token_usage / ai_message / system_action
- 脱敏机制：SENSITIVE_KEY_PATTERN（api_key/token/secret/password）-> [REDACTED]；SECRET_VALUE_PATTERN（sk-.../Bearer ...）-> [REDACTED]；超长字符串截断
- 按 thread_id 分文件 `logs/{safe_id}.jsonl`

### Token 成本追踪

`TokenTracker`（token_tracker.py），线程安全：

- `MODEL_PRICING` 定价表（gpt-4o/4o-mini/claude-3-5-sonnet 等），_default (0.001, 0.002)
- `record()` 按 thread_id 聚合，算 `cost = (prompt*in_rate + completion*out_rate)/1000`
- 累计超 $5.0 打印警告
- 多 provider usage 字段兜底提取：优先 usage_metadata，回退 response_metadata.token_usage

### 多模型 Provider 适配

`get_provider()`（provider.py:31）支持：

- OpenAI 兼容：openai/aliyun/dashscope/z.ai/tencent/other -> langchain_openai.ChatOpenAI，内置兼容 base_url 字典
- Anthropic -> langchain_anthropic.ChatAnthropic
- Ollama -> langchain_community ChatOllama，默认 localhost:11434
- `ProviderFactory` 类按 `provider:model` 缓存 LLM 实例

### 动态技能发现与 MCP 适配器

**插件系统**（plugin_loader.py）：

- 扫描 `workspace/office/skills/` 下的 SKILL.md/README.md
- 两阶段零信任调用：`mode="help"` 首次加载说明书；`mode="run"` 经 execute_office_shell 在 office 沙箱内执行
- lru_cache + mtime 实现热更新

**MCP 适配器**（mcp_adapter.py）：

- 通过 stdio 与本地 MCP 进程通信（subprocess.Popen）
- JSON-RPC 2.0 握手（initialize，protocolVersion 2024-11-05）
- `MCPManager.get_all_tools()` 将 MCP 工具转为 LangChain StructuredTool，工具名加 `mcp_{service}_{tool}` 前缀
- 15s 读超时，超时自动 stop

### Context Pack（结构化事实来源）

从 `docs/` 加载结构化文档作为受控上下文（非把整个项目塞进 prompt）：

- 核心 pack：INDEX.md、runtime-overview.md、sandbox-policy.md、tool-contracts.md、session-model.md
- 按用户输入关键词动态选择 playbook（如含"文件/edit"追加 file-edit.md）
- 含沙盒协议与工具契约作为运行时事实来源

### CLI 工具（Typer）

四个命令：`config`（交互式配置）、`run`（启动 Agent）、`monitor`（实时监控面板）、`doctor`（运行时一致性自检）

- monitor 支持 `--list` 列会话、`--thread-id` 指定会话，tail -f 实时渲染审计事件
- doctor 校验 docs 完整性、policies.json 有效性、工具白名单覆盖、近期策略违规

## 难点与取舍

- **自研状态机 vs LangGraph**：选择自研（v2.0.0 重大变更），获得条件路由+最大循环限制的完全控制，减少重型依赖
- **JSONL vs 数据库审计**：选 JSONL（轻量可追溯，易于版本控制，按会话分文件）
- **SQLite vs Redis 记忆**：选 SQLite（单机部署优先，无外部依赖，线程安全）
- **3 协程 vs 单线程**：异步状态机分离用户输入、Agent 执行、心跳检测，避免阻塞
- **AST vs eval**：选 AST 安全计算器从根本上杜绝注入

## 成果

- 完整 Agent 运行时框架，支持透明可审计的工具执行
- 测试基线：**114 passed, 0 errors, 0 failures**
  - 85 条单元测试（状态机、上下文、Agent、Token、中间件、Provider、沙箱、Doctor 等）
  - 14 条 Agent Eval（行为级评估：单轮/多轮对话、工具调用收敛、记忆裁剪、会话隔离、安全拒绝）
  - 15 条 Integration Smoke（端到端：完整工具循环、日志可记录状态、会话隔离）
- 支持 OpenAI / Anthropic / Ollama / OpenAI-compatible 多模型接入
- 动态技能发现系统，支持 MCP 协议

## 可追问话题

- 状态机条件路由如何实现？agent↔tools 循环如何防死循环？
- 三协程如何避免竞态？为什么心跳和用户输入共享同一队列？
- 零信任沙箱的路径穿越防护为什么用 commonpath 而非前缀匹配？
- 分层记忆三层各自存什么？用户画像为什么标注"不可信"？
- Token 成本追踪如何跨 Provider 提取 usage 字段？
- MCP 适配器如何处理 capability 协商？读超时如何处理？
- Context Pack 和直接把文档塞进 prompt 有什么区别？
