# 部署上线清单（Render + Vercel + .top 域名）

> 本项目：AI 面试助手（personal-ai-profile）
> 前端：Next.js 15 -> Vercel（免费）
> 后端：FastAPI -> Render 免费层（$0）
> 数据库：不需要（后端无状态，知识库随代码部署）
> 域名：`.top`（无需备案）

---

## ⚠️ Render 免费层须知

1. **15 分钟无访问会休眠**，下次首请求冷启动需 30-50 秒
2. **每月 750 小时免费额度**（够单实例 24×7 跑满一个月）
3. 不支持自定义域名走 HTTPS（免费层只有 `xxx.onrender.com`）
   - 如果你需要自己的域名，需要升级到付费层（$7/月）
   - 但 `xxx.onrender.com` 自带 HTTPS，面试演示够用

**冷启动应对**：面试前 1 分钟先访问一次 `https://你的后端域名.onrender.com/health` 预热，之后全程不会休眠。

---

## 一、你要买/注册的东西

### 1. 域名（.top）

**在哪买**：阿里云万网 `wanwang.aliyun.com` 或腾讯云 `dnspod.cloud.tencent.com`

**买法**：
1. 注册账号 -> 实名认证（身份证，几分钟过）
2. 搜索想要的域名，如 `hireproof.top`、`askwho.top`
3. `.top` 首年通常 10-25 元，续费 30-40 元/年
4. 下单付款，域名到手

**不需要备案**：`.top` 是国际域名，不强制备案。

### 2. Render 账号

**注册**：`render.com`，用 GitHub 账号登录
**费用**：免费层 $0，单实例 750 小时/月

### 3. Vercel 账号

**注册**：`vercel.com`，用 GitHub 账号登录
**费用**：免费层 100GB 流量/月

---

## 二、前置准备（本地做完）

### 1. 删除调试脚本

这三个文件含硬编码的 API key，**必须删掉再推**：
```bash
cd api
del _glm_stream.py _diag.py _stream_test.py
```

### 2. 确认 .gitignore 完整

根目录 `.gitignore` 应包含：
```
.env
.env.local
__pycache__/
*.pyc
.next/
node_modules/
.venv/
.pytest_cache/
api/_*.py
```

### 3. 初始化 Git 仓库 + 推到 GitHub

```bash
# 在项目根目录 D:\claudecode\personal-ai-profile
git init
git add .
git commit -m "init: AI interview assistant"
```

去 GitHub 新建仓库 `personal-ai-profile`，推送：
```bash
git remote add origin https://github.com/zhanpeng911-droid/personal-ai-profile.git
git branch -M main
git push -u origin main
```

---

## 三、后端部署（Render）

### 1. 新建 Web Service

1. Render 控制台 -> `New +` -> `Web Service`
2. 连接 GitHub 仓库 `personal-ai-profile`
3. 配置：
   - **Name**：`ai-profile-api`
   - **Region**：选离你最近的（如 Singapore）
   - **Branch**：`main`
   - **Root Directory**：`api`
   - **Runtime**：`Python 3`
   - **Build Command**：`pip install -r requirements.txt`
   - **Start Command**：`uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**：`Free`

4. 点 `Create Web Service`

### 2. 配置环境变量

在 Render 的 `Environment` 标签页添加：

| 变量 | 值 | 说明 |
|------|-----|------|
| `APP_ENV` | `production` | 开启生产守卫 |
| `SESSION_SECRET` | 32位随机串 | 见下方生成方法 |
| `COOKIE_SECURE` | `true` | HTTPS 下必须 |
| `ALLOWED_ORIGINS` | `https://你的域名.top` | 填你买的域名（Vercel 那个） |
| `INVITE_CODES_JSON` | `[{"id":"...","hash":"...","daily_limit":30,...}]` | 见下方生成方法 |
| `LLM_PROVIDER` | `openai_compatible` | |
| `LLM_BASE_URL` | `https://api.siliconflow.cn/v1` | |
| `LLM_MODEL` | `Qwen/Qwen2.5-7B-Instruct` | |
| `LLM_API_KEY` | `sk-xxxx` | 你的 SiliconFlow key |
| `KNOWLEDGE_DIR` | `../knowledge` | 知识库目录（随代码部署） |

**⚠️ 注意**：Render 免费层后端域名是 `xxx.onrender.com`，`ALLOWED_ORIGINS` 填的是**前端域名**（Vercel 的），不是后端的。

### 3. 生成 SESSION_SECRET

本地运行：
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
输出的字符串填到 `SESSION_SECRET`。

### 4. 生成邀请码

本地运行：
```bash
cd api
.venv\Scripts\python.exe -c "from app.config import hash_invite_code; print(hash_invite_code('你想设的邀请码'))"
```

比如邀请码设为 `ZP-2026-INTERVIEW`，把输出的 hash 填到 `INVITE_CODES_JSON`：
```json
[{"id":"main","hash":"输出的hash","note":"面试用","expires_at":"2027-12-31T23:59:59+08:00","daily_limit":30,"max_total_uses":200}]
```

### 5. 验证后端

部署成功后 Render 会给域名（如 `ai-profile-api.onrender.com`），访问：
```
https://ai-profile-api.onrender.com/health
```
应返回 `{"status":"ok","knowledge_docs":13,"llm_provider":"openai_compatible"}`

**第一次部署 + 每次冷启动后首请求会慢（30-50秒），属正常。**

---

## 四、前端部署（Vercel）

### 1. 新建项目

1. Vercel 控制台 -> `Add New Project` -> 选择 GitHub 仓库
2. Framework Preset 选 `Next.js`
3. Root Directory 设为 `web/`

### 2. 配置环境变量

在 Vercel 的 `Settings -> Environment Variables` 添加：

| 变量 | 值 |
|------|-----|
| `NEXT_PUBLIC_API_BASE` | `https://ai-profile-api.onrender.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://你的域名.top` |

**⚠️ 重要**：
- `NEXT_PUBLIC_API_BASE` 填 Render 后端的完整域名（含 https，不带尾斜杠）
- 免费层 Render 域名固定是 `xxx.onrender.com`，部署后记下来

### 3. 部署

点 `Deploy`，Vercel 自动 build。部署后会给一个预览域名。

---

## 五、域名配置（DNS）

### 1. Vercel 绑定域名

1. Vercel 项目 -> `Settings -> Domains`
2. 添加 `你的域名.top` 和 `www.你的域名.top`
3. Vercel 会给你 DNS 记录，去域名注册商那边配置：
   - `A` 记录：`@` -> Vercel 给的 IP
   - `CNAME` 记录：`www` -> `cname.vercel-dns.com`

### 2. 后端域名

Render 免费层用默认的 `xxx.onrender.com`，不支持自定义域名。
如果一定要 `api.你的域名.top`，需升级 Render 付费层（$7/月）。

**面试演示建议**：直接用 `xxx.onrender.com`，不影响功能，省 $7/月。

### 3. 更新 CORS

域名绑定后，确认 Render 环境变量 `ALLOWED_ORIGINS` 包含前端实际访问的域名：
```
ALLOWED_ORIGINS=https://你的域名.top,https://www.你的域名.top
```
如果不带 www 访问，就只填 `https://你的域名.top`。

---

## 六、上线检查清单

部署完成后，逐项验证：

- [ ] 访问 `https://你的域名.top` 能打开首页
- [ ] 访问 `https://你的域名.top/projects` 能看到两个项目
- [ ] 访问 `https://你的域名.top/access` 能输入邀请码
- [ ] 先访问 `https://ai-profile-api.onrender.com/health` 预热后端
- [ ] 输入邀请码后跳转到 `/ask`，能正常聊天
- [ ] AI 回答正常（流式输出，无重复，无来源行）
- [ ] 浏览器地址栏是 HTTPS（锁图标）
- [ ] 手机访问正常（响应式）
- [ ] `https://ai-profile-api.onrender.com/health` 返回 ok

---

## 七、费用汇总

| 项目 | 费用 |
|------|------|
| 域名 `.top` | ~15 元/年（首年），~35 元/年（续费） |
| Vercel 前端 | 免费 |
| Render 后端 | 免费 |
| SSL 证书 | 免费（Vercel + Render 自动 HTTPS） |
| 数据库 | 不需要 |
| **合计** | 首年约 15 元，之后每年约 35 元 |

---

## 八、注意事项

1. **冷启动**：Render 免费层 15 分钟无访问会休眠，首请求 30-50 秒。面试前先访问 `/health` 预热
2. **限流计数器是内存态**：重新部署后每日配额会重置。面试前不要随便重新部署
3. **LLM API key 在 Render 环境变量里**，不在代码里，安全
4. **SESSION_SECRET 必须稳定**：换了之后所有已发出的 cookie 失效，面试官需要重新输入邀请码
5. **知识库更新**：改了 `knowledge/` 下的 markdown 后，push 到 GitHub，Render 自动重新部署，知识库重新加载
6. **CORS 必须匹配**：`ALLOWED_ORIGINS` 要和前端实际访问的域名完全一致（含 https）
7. **`NEXT_PUBLIC_API_BASE` 是构建时注入的**：改了之后要在 Vercel 重新部署才生效（不是热更新）

---

## 九、我还需要帮你做的

- [ ] 写 `api/Dockerfile`（可选，Render 也能用原生 Python 部署）
- [ ] 确认 `.gitignore` 排除敏感文件
- [ ] 确认 `uvicorn` 监听 `0.0.0.0:$PORT`（Render 要求）
- [ ] 删除调试脚本 `_glm_stream.py` 等

买完域名后告诉我域名是什么，我帮你把最后的配置确认好。
