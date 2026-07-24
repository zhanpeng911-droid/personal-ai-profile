# AI 求职个人分身网站（低成本 MVP）设计方案

> **文档状态：实现中**  
> **目标版本：MVP v0.1**  
> **更新日期：2026-07-22**  
> **仓库路径：`personal-ai-profile/`**

## 1. 项目目标

建设一个面向招聘方的中文个人作品集与「AI 简历分身」网站。访问者可先快速了解候选人定位、项目与能力；通过邀请码后，可向 AI 提问与候选人经历相关的问题。

### 1.1 MVP 优先级

1. **可信**：回答只基于人工审核过的资料，不确定时明确说明资料未覆盖。
2. **低成本**：静态托管 + 文件型资料库 + 可替换低价模型；不依赖付费数据库或向量库。
3. **可展示**：模型未配置 / 额度用尽 / 服务异常时，静态作品集与 FAQ 仍可用。
4. **可扩展**：后续可接入 Supabase、pgvector、LangGraph、后台管理，不推翻 MVP。

### 1.2 非目标（v0.1 不做）

- 不做**简历 PDF 下载**（简历请在招聘平台下载，站点只做作品集 + AI 问答 + 联系引导）。
- 不做多 Agent 编排、长期记忆、自动联网搜索。
- 不做招聘方账号注册、完整 CRM 或聊天记录后台。
- 不公开私人敏感资料、完整私人笔记或项目源码。
- 不承诺 AI 对未提供资料的问题作出推测性回答。
- **内容写作不在本阶段范围**：姓名、教育、项目细节等用占位数据，后续再替换。

---

## 2. 目标用户与核心路径

### 2.1 用户

| 用户 | 需要解决的问题 | 关键体验 |
| --- | --- | --- |
| HR / 招聘负责人 | 60 秒内了解候选人是否匹配 | 定位、项目、技能、FAQ、招聘平台找简历 |
| 技术面试官 | 追问项目设计、取舍与能力 | 项目详情有结构；AI 回答附来源 |
| 网站所有者 | 低成本维护、控制回答范围 | Markdown 审核、邀请码、限额、日志 |

### 2.2 访问路径

```text
访问首页
  ├─ 浏览简介 / 项目 / 技能 / FAQ / 联系方式
  │    └─ 需要完整简历 → 引导至招聘平台（Boss / 智联 / 猎聘等）
  └─ 点击「与 AI 分身交流」
       ├─ 未验证邀请码：/access 输入邀请码
       │    ├─ 有效：写入 HttpOnly Cookie，跳转 /ask
       │    └─ 无效 / 过期 / 超限：统一错误 + 联系入口
       └─ 已验证：进入 /ask
              ├─ 选推荐问题或输入
              ├─ 检索已审核资料
              ├─ FAQ / 摘录 / LLM / 拒答
              └─ 显示回答、来源、剩余次数、追问建议
```

### 2.3 简历策略（重要变更）

| 项 | 说明 |
| --- | --- |
| 站点内下载 PDF | **不做** |
| 完整简历获取 | 招聘平台（Boss 直聘、智联、猎聘等） |
| 站点职责 | 作品集证据 + 可追问 AI 分身 + 邮箱/GitHub/平台说明 |
| 文案原则 | 不出现「下载简历」按钮；统一写「完整简历请在招聘平台查看」 |

---

## 3. 技术选型

### 3.1 推荐组合

| 层级 | 技术 | 原因 |
| --- | --- | --- |
| Web | Next.js 14+ App Router + TS + Tailwind | SEO、SSG、免费托管 |
| API | FastAPI + Pydantic v2 | 资料处理 / 未来 RAG 友好 |
| 知识库 | Git 管理 Markdown + `manifest.json` | 零 DB、可审查、可回溯 |
| 检索 | 关键词 / BM25 风格本地评分 | 资料量小，无 embedding 成本 |
| 模型 | OpenAI-compatible / Ollama / disabled | 可切换、可降级 |
| 访问控制 | 邀请码哈希 + 签名 Cookie | 无账号系统 |
| 限流 | 进程内计数（单实例） | 零成本演示 |
| 部署 | Vercel（Web）+ Render/Railway（API） | 低门槛 |

### 3.2 成本预期

| 项目 | MVP | 说明 |
| --- | ---: | --- |
| 域名 | ¥50–150 / 年 | 可选 |
| 前端托管 | ¥0 | 静态优先 |
| API 托管 | ¥0–50 / 月 | 视免费额度 |
| 数据库 | ¥0 | MVP 不用 |
| 模型 | ¥0–100 / 月 | 邀请码 + FAQ 控成本 |
| 合计 | 约 ¥50–250 首年起步 | 不含规模化 |

### 3.3 取舍

- 不用向量库：主题明确，关键词可控。
- 不强制 LLM：FAQ 直出；无模型时返回资料摘录。
- 不存完整会话：只记脱敏计数与错误类型。
- 单实例限流：够演示；多副本再换 Redis。

---

## 4. 仓库与信息架构

### 4.1 仓库结构

```text
personal-ai-profile/
├─ web/                         # Next.js 前端
│  ├─ app/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx               # 首页
│  │  ├─ about/page.tsx
│  │  ├─ projects/
│  │  │  ├─ page.tsx
│  │  │  └─ [slug]/page.tsx
│  │  ├─ contact/page.tsx       # 联系 + 招聘平台引导（无 PDF）
│  │  ├─ faq/page.tsx
│  │  ├─ access/page.tsx
│  │  └─ ask/page.tsx
│  ├─ components/
│  ├─ lib/
│  ├─ content/                  # 前端静态展示用 JSON（可由 knowledge 同步）
│  └─ package.json
├─ api/                         # FastAPI
│  ├─ app/
│  │  ├─ main.py
│  │  ├─ config.py
│  │  ├─ models/
│  │  ├─ routers/
│  │  ├─ services/
│  │  └── security/
│  ├─ tests/
│  ├─ requirements.txt
│  └── .env.example
├─ knowledge/
│  ├─ profile/
│  ├─ projects/
│  ├─ skills/
│  ├─ interview/
│  └─ manifest.json
├─ evals/
│  └── qa_cases.json
├─ docs/
│  └── MVP_DESIGN.md            # 可软链本设计
└─ README.md
```

### 4.2 页面清单

| 路径 | 页面 | 主要内容 | 公开性 |
| --- | --- | --- | --- |
| `/` | 首页 | 定位、CTA、核心数据、项目预览 | 公开 |
| `/about` | 关于我 | 教育、方向、技能、工作方式（占位可） | 公开 |
| `/projects` | 项目列表 | 卡片、标签、筛选 | 公开 |
| `/projects/[slug]` | 项目详情 | 问题、职责、架构、取舍、成果、追问入口 | 公开 |
| `/contact` | 联系与简历 | 邮箱、GitHub、**招聘平台获取简历**说明 | 公开 |
| `/faq` | 精选问答 | 审核 FAQ | 公开 |
| `/access` | 邀请码 | 验证、隐私提示 | 公开 |
| `/ask` | AI 问答 | 对话、推荐问、来源、配额 | 邀请码后 |

**已删除：** `/resume` 及任何 PDF 下载入口。

### 4.3 首页首屏结构（文案可后填）

```text
[姓名占位]
AI Agent / RAG 工程方向求职者

把可验证的工程经历，做成可追问的 AI 简历分身。

[与 AI 分身交流]  [查看项目]  [如何获取简历]

Python · FastAPI · RAG · Agent Workflow · Context Engineering
```

### 4.4 视觉

- 深色科技感为主，浅色可选；避免过度赛博动效。
- 背景深墨蓝 / 石墨灰，强调电蓝或青绿；高对比。
- 手机单列；对话输入固定底部；触控 ≥ 44px。
- 语义标题、键盘可访问、焦点可见。

---

## 5. 内容模型

### 5.1 Frontmatter（强制）

```yaml
---
id: project-novamind
kind: project
project: NovaMind
visibility: hr
verified: true
updated_at: 2026-07-22
keywords: [Python, FastAPI, RAG, AI Agent]
summary: 占位摘要。
---
```

**硬性规则：** 仅 `verified: true` 且 `visibility: hr` 可进入 AI 上下文与公开页。

### 5.2 内容阶段策略

| 阶段 | 做什么 | 不做什么 |
| --- | --- | --- |
| 实现期 | 用占位 Markdown / JSON 跑通全链路 | 不纠结真实姓名、指标、项目细节 |
| 内容期 | 本人审核后改 `verified`、补写项目 | 不在代码里硬编码隐私 |

项目模板字段（实现时按此解析展示）：

1. 问题与目标用户  
2. 个人职责与贡献  
3. 架构与关键技术  
4. 难点 / 取舍 / 结果  
5. 可公开成果（无则不写数字）  
6. 可追问话题 + `updated_at`

### 5.3 `manifest.json` 示例

```json
{
  "version": 1,
  "documents": [
    {
      "id": "project-novamind",
      "path": "projects/novamind.md",
      "kind": "project",
      "slug": "novamind"
    }
  ]
}
```

---

## 6. AI 问答设计

### 6.1 请求链路

```text
POST /v1/chat
  → 校验签名 Cookie
  → 按 invite_id 查日配额
  → 输入校验（长度 / 注入 / 敏感）
  → 加载 verified+hr 分块
  → 关键词 Top-K
  → FAQ 高置信？ → 固定答案 + 引用
  → 资料不足？ → 拒答 + 联系引导
  → LLM（若配置）→ 输出校验
  → 返回 answer / sources / mode / remaining / suggestions
```

### 6.2 回答约束

- 只用已审核资料；不以常识补个人事实。
- 资料不足：「没有可验证资料确认」，建议联系本人或招聘平台沟通。
- 不披露：薪资底线、住址、证件、私人关系、未公开项目、内部源码。
- 不执行：角色覆盖、提示词泄露、改库、外呼工具。
- 中文，约 150–450 字；事实 / 解释 / 推测分开。
- 重要回答附 1–3 条来源 id。

### 6.3 API 契约

#### 验证邀请码

```http
POST /v1/access/verify
Content-Type: application/json

{ "invite_code": "XXXX-XXXX" }

200:
{
  "ok": true,
  "expires_at": "2026-07-22T23:59:59+08:00",
  "daily_limit": 30
}
# Set-Cookie: ai_profile_session=...; HttpOnly; Secure; SameSite=Lax; Path=/
```

#### 会话状态

```http
GET /v1/access/me
Cookie: ai_profile_session=...

200: { "authenticated": true, "remaining_questions": 28, "daily_limit": 30 }
401: { "authenticated": false }
```

#### 问答

```http
POST /v1/chat
Cookie: ai_profile_session=...
Content-Type: application/json

{
  "message": "NovaMind 解决了什么问题？",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}

200:
{
  "answer": "...",
  "sources": [
    { "id": "project-novamind", "title": "NovaMind 项目说明", "anchor": "项目目标" }
  ],
  "mode": "faq|retrieval|llm|refusal",
  "remaining_questions": 28,
  "suggested_questions": ["...", "..."]
}
```

错误码：

| HTTP | 含义 |
| --- | --- |
| 400 | 输入非法 / 过长 |
| 401 | 无有效会话 |
| 403 | 邀请码策略拒绝（过期等，verify 时） |
| 429 | 日配额用尽 |
| 503 | 依赖异常（可降级时尽量 200 + mode） |

### 6.4 LLM Provider

```python
class LLMProvider(Protocol):
    async def generate(
        self,
        *,
        system_prompt: str,
        user_message: str,
        context: list[KnowledgeChunk],
        history: list[ChatMessage],
    ) -> str: ...
```

| mode | 条件 | 行为 |
| --- | --- | --- |
| `faq` | FAQ 高置信 | 零模型调用 |
| `retrieval` | 无可用模型 | 精简摘录 + 说明 AI 暂不可用 |
| `llm` | Provider + Key 就绪 | 受约束生成 |
| `refusal` | 敏感 / 无关 / 资料不足 | 固定拒答 |

---

## 7. 邀请码、隐私与安全

### 7.1 配置

```env
INVITE_CODES_JSON='[
  {
    "id": "hr-2026-a",
    "hash": "<sha256 或 bcrypt>",
    "note": "招聘方 A",
    "expires_at": "2026-09-30T23:59:59+08:00",
    "daily_limit": 30,
    "max_total_uses": 100
  }
]'
SESSION_SECRET='<至少 32 字符随机串>'
```

Cookie 仅含 `invite_id` + 过期时间；不含明文邀请码。

### 7.2 防护

| 风险 | 措施 |
| --- | --- |
| 未授权问答 | `/v1/chat` 必须 Cookie |
| 暴力猜码 | IP + 失败次数限流、统一错误 |
| 成本滥用 | 日 30 次、输入 800 字、输出上限、FAQ 优先 |
| 提示注入 | 系统约束、无工具、敏感拒答 |
| 资料泄露 | 只加载 `hr` + `verified` |
| XSS | 前端不渲染模型原始 HTML |
| CSRF/跨域 | CORS 白名单、SameSite Cookie |
| 日志 | 匿名 ID、状态、耗时、分类；不记全文 |

### 7.3 隐私文案

> 本站 AI 问答仅基于候选人审核过的求职资料。请勿输入个人敏感信息。默认仅保存访问统计与错误信息，不保存完整对话。完整简历请在招聘平台下载查看。

---

## 8. 环境变量与可观测性

```env
APP_ENV=production
ALLOWED_ORIGINS=https://your-domain.example,http://localhost:3000
SESSION_SECRET=
INVITE_CODES_JSON=
DAILY_DEFAULT_LIMIT=30
MAX_MESSAGE_CHARS=800
MAX_RESPONSE_CHARS=1500
LLM_PROVIDER=disabled|openai_compatible|ollama
LLM_BASE_URL=
LLM_API_KEY=
LLM_MODEL=
KNOWLEDGE_DIR=../knowledge
```

最小日志：

```json
{
  "timestamp": "2026-07-22T12:00:00Z",
  "invite_id": "hr-2026-a",
  "event": "chat_completed",
  "mode": "faq",
  "category": "project",
  "latency_ms": 152,
  "status": 200
}
```

监控：验证成功率、日问答量、FAQ 命中率、拒答率、模型延迟/错误、分类标签分布。

---

## 9. 前端实现要点

### 9.1 数据流

- 静态页：读 `web/content/*.json` 或 build 时读 `knowledge/`。
- 问答页：浏览器调 `NEXT_PUBLIC_API_BASE`（如 `http://localhost:8000`）。
- Cookie 跨域：API `CORS` 需 `allow_credentials=true`，前端 `credentials: 'include'`。

### 9.2 组件建议

| 组件 | 职责 |
| --- | --- |
| `SiteHeader` / `SiteFooter` | 导航；Footer 含招聘平台说明链接 |
| `ProjectCard` | 列表卡片 |
| `FaqList` | 折叠 FAQ |
| `ContactPanel` | 邮箱 / GitHub / **无 PDF** / 平台文案 |
| `InviteForm` | 邀请码提交 |
| `ChatPanel` | 消息列表、输入、来源 chips、剩余次数 |

### 9.3 首页 CTA（固定）

1. 与 AI 分身交流 → `/access` 或 `/ask`
2. 查看项目 → `/projects`
3. 如何获取简历 → `/contact#resume-on-platforms`

禁止：`下载简历`、`/resume.pdf`、附件直链。

---

## 10. 后端实现要点

### 10.1 模块

| 模块 | 职责 |
| --- | --- |
| `config.py` | 环境变量、邀请码列表解析 |
| `services/knowledge.py` | 扫描 MD、过滤 verified/hr、分块 |
| `services/retrieve.py` | 关键词打分 Top-K |
| `services/faq.py` | FAQ 匹配 |
| `services/chat.py` | 编排 mode 选择与回复 |
| `services/llm.py` | Provider 适配 |
| `security/session.py` | 签发 / 校验 Cookie |
| `security/rate_limit.py` | 验证失败 + 日配额 |
| `routers/access.py` | verify / me / logout |
| `routers/chat.py` | chat |

### 10.2 检索（MVP）

1. 对 query 分词（中英简单切分 + 小写）。
2. 与 chunk 的 `keywords` + 正文做词重叠 + 标题加权。
3. 取 Top 5；分数低于阈值则视为资料不足。

### 10.3 FAQ 匹配

- 对 `interview/faq.md` 中每条 Q 做相似度（词重叠或简单归一化）。
- 超过阈值（如 0.55）则 `mode=faq`，直接返 A。

---

## 11. 验收与测试

### 11.1 后端

| 测试项 | 验收 |
| --- | --- |
| 资料加载 | `verified=false` / 非 `hr` 不可检索 |
| 邀请码 | 正确成功；错误/过期/达限失败 |
| 会话 | 无 Cookie → 401 |
| 配额 | 超限 → 429，不调模型 |
| FAQ | 命中不调模型 |
| 资料不足 | 明确拒答，不编造 |
| 敏感题 | 隐私边界说明 |
| 模型失败 | 可读降级 |
| **无简历下载** | 仓库无 public PDF 下载路由与按钮 |

### 11.2 评测集

至少 50 题（内容期再贴真实事实）：

- 20 已知事实 / 10 项目深挖 / 10 能力匹配 / 5 诱导编造 / 5 敏感无关

### 11.3 前端

- `npm run lint`、`npm run build` 通过  
- 360px / 平板 / 桌面无横向溢出  
- title / description / OG / favicon / sitemap  
- 无邀请码无法有效问答  
- **全站无「下载简历」**

---

## 12. 交付里程碑

### M1：静态可展示

- 初始化、视觉、响应式  
- 首页 / about / projects / contact / faq  
- 占位内容  
- SEO 基础  
- **完成：** 无后端也是可投递作品集（简历去招聘平台）

### M2：可信问答 API

- 资料加载 + 关键词检索  
- 邀请码 / Cookie / 日限额 / 拒答  
- FAQ + retrieval 降级  
- 单测 + 少量 eval  
- **完成：** 有码才能问，回答可追溯

### M3：LLM 接入

- OpenAI-compatible / Ollama  
- 超时与降级  
- 访问统计日志  
- **完成：** 有模型更自然；无模型仍可信

### M4：上线加固（后续）

- Redis / Supabase 限流与记录  
- 流式输出、后台改资料、反馈  
- 有规模再考虑 embedding / Agent 路由

---

## 13. 实现期 vs 内容期

| 实现期（当前） | 内容期（后续） |
| --- | --- |
| 代码、接口、页面、安全链路 | 真实姓名、项目叙述、指标 |
| 占位 knowledge | 本人审核 `verified: true` |
| 演示邀请码（本地 env） | 正式码分发策略 |
| 不绑定真实简历文件 | 招聘平台资料与站点口径对齐 |

---

## 14. 结论

MVP 先交付**独立成立的静态作品集**，再叠加**邀请码保护、可引用、可降级的资料问答**。  
完整简历**不在本站下载**，统一引导至招聘平台；站点价值在于可验证项目证据与可追问 AI 分身。

> 第一版核心不是「AI 能说多少」，而是「每一句关于候选人的话都能被资料证明」。
