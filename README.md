# AI 求职个人分身网站（MVP）

低成本个人作品集 + 邀请码保护的 AI 简历分身。

**完整简历不在本站下载**，请在招聘平台（Boss / 智联 / 猎聘等）获取。

## 结构

```text
personal-ai-profile/
├─ web/          # Next.js 前端
├─ api/          # FastAPI 后端
├─ knowledge/    # 已审核 Markdown 资料（当前为占位）
└─ evals/        # 评测用例（可扩展）
```

## 快速开始

### 1. API

```bash
cd api
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
# 可选：复制 .env.example 为 .env
uvicorn app.main:app --reload --port 8000
```

本地未配置邀请码时，会自动注入演示码 **`DEMO-2026`**。

### 2. Web

```bash
cd web
npm install
copy .env.local.example .env.local   # Windows
npm run dev
```

打开 http://localhost:3000

### 3. 测试 API

```bash
cd api
pytest -q
```

## 环境变量

见 `api/.env.example` 与 `web/.env.local.example`。

邀请码哈希为邀请码明文（大写）的 SHA-256 hex：

```bash
# DEMO-2026
python -c "import hashlib; print(hashlib.sha256(b'DEMO-2026').hexdigest())"
```

## 设计文档

仓库外：`../AI_PROFILE_MVP_DESIGN.md`
