---
id: project-agent-harness
kind: project
project: Agent Harness
visibility: hr
verified: true
updated_at: 2026-07-22
keywords: [Agent Harness, 工具调用, 可观测, 安全]
summary: Agent 运行时约束、工具权限与可观测性的工程实践（占位）。
---

# Agent Harness

## 解决的问题

Agent 一旦拥有工具与长上下文，容易越权、幻觉或成本失控。Harness 强调权限边界、轨迹记录与失败恢复。

## 个人职责（占位）

- 定义工具白名单与无工具默认态
- 记录关键事件而非完整隐私正文
- 设计超时、重试与降级

## 架构与技术

- 会话签名与访问控制
- 配额与限流
- 结构化日志字段

## 难点与取舍

- MVP 默认无工具调用，降低攻击面。
- 日志默认脱敏，不落完整对话。

## 可追问话题

- 邀请码与会话 Cookie 如何设计？
- 如何做提示注入防护？
