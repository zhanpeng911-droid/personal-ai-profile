---
id: skill-agent
kind: skill
visibility: hr
verified: true
updated_at: 2026-07-22
keywords: [Agent, 状态机, Context Engineering, Harness, 零信任, 沙箱, MCP, Token追踪, 审计]
summary: Agent 运行时设计能力，自研异步状态机、上下文工程、零信任工具执行与可观测性。
---

# Agent 架构能力

## 自研异步状态机（NovaMind）

- 替代 LangGraph，Node + Edge 有向图，asyncio 异步
- 条件路由：route(state) 判断 tool_calls 决定 agent↔tools 循环
- max_iterations=50 防死循环
- Agent 级状态跨 run/astream 保持连贯
- 三协程并发：user_input_loop / agent_worker / pacemaker_loop，EventBus 队列通信

## Context Engineering

- **Context Pack**：从 docs/ 加载结构化文档作为受控上下文（非整个项目塞进 prompt），按任务关键词动态选择 playbook
- **回合级裁剪**：trigger=40/keep=10，超阈值保留近 10 轮，丢弃的生成 LLM 摘要
- **分层记忆**：短期（内存 messages）/ 中期（SQLite summary + 裁剪摘要）/ 长期（user_profile.md）
- 用户画像标注"不可信，不得当指令"防注入

## Harness Engineering（零信任）

- **策略层**：12 工具白名单 + confirmation_keywords（删除/批量/覆盖需确认）
- **沙箱路径穿越防护**：os.path.commonpath 而非前缀匹配
- **受控 Shell**：元字符正则拦截 + 命令白名单（pwd/echo/ls/dir/cat/type/mkdir）
- **AST 安全计算器**：替代 eval，_SAFE_OPERATORS 白名单拒绝函数调用/属性访问
- **两阶段技能调用**：help 模式先读说明书，run 模式在 office 沙箱内执行

## 可观测性

- JSONL 审计日志（9 类事件），单例异步 logger（内存队列+守护线程）
- 脱敏机制（密钥正则 -> [REDACTED]）
- Token 成本追踪（MODEL_PRICING 定价表，$5 预警，多 provider usage 兜底提取）
- Rich 实时监控面板（tail -f 渲染审计事件）
- Doctor 自检（docs 完整性、策略有效性、工具覆盖、违规扫描）

## 多模型与扩展

- ProviderFactory：OpenAI / Anthropic / Ollama / OpenAI 兼容（aliyun/tencent/z.ai），按 provider:model 缓存
- MCP 适配器：stdio 通信，JSON-RPC 2.0 握手，工具名加前缀，15s 读超时
- 动态技能发现：扫描 skills/ 下 SKILL.md，lru_cache + mtime 热更新
- 中间件管道：洋葱模型，计时/日志/限流可插拔
