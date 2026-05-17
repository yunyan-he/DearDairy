# DearDairy 🌙

> *一款与你一同成长的私人 AI 日记。*

**[English README →](./README.md)**

---

DearDairy 不只是一个日记 App。它是一个**长期成长伴侣** —— 一套系统，用来追踪的不仅仅是你写了什么，而是你正在成为怎样的人。

核心理念：人格不是静止的。每一周、每一个月，你的行为模式都在悄悄改变。DearDairy 会构建一份**活的人格档案（Persona）**，随着每一篇日记、每一次周复盘、每一次月复盘持续演化 —— 让你有机会清晰地看见自己如何随时间改变。

---

## 🧭 用户旅程

DearDairy 被设计为一个完整的成长闭环：

```
首次启动 → 心理问卷 → 生成初始人格档案（Persona）
     ↓
每日写日记（AI 提问 + 情绪检测）
     ↓
周复盘 → 提取近期行为模式 → 更新 Persona 的「近期观察」
     ↓
月复盘 → 稳定模式晋升为核心 Persona → 过时模式退场
     ↓
年复盘 → 完整人格重建 → 看清这一年你走了多远
```

### 1. 引导入门 —— 先认识现在的自己

在你写下第一篇日记之前，DearDairy 会让你完成一份简短的**心理问卷**。这不是泛泛的性格测试 —— 它的目的是在几个核心维度上，让你说清楚现在的自己：你如何应对压力、是什么在驱动你、你在哪里容易卡住。

输出的结果：你的**初始 Persona** —— 一份关于「此刻的你」的结构化档案。它是后续一切对比的基准线。


### 2. 每日写日记

写你的日记，选一个心情。就这样。

每篇日记写完后，AI 会结合你的**当下内容**和**当前 Persona**，生成一个专属的反思问题 —— 不是随机的引导语，而是真正针对你当下模式和未解问题的追问。

**情绪安全网：** 如果 AI 检测到情绪低落或持续负面的信号，它不会继续追问 —— 而是温和地引导对话走向更扎实的地方。*（一套更严谨的、以认知行为疗法 CBT 为理论依据的介入机制，是后续升级的重点方向之一，详见 Roadmap。）*

### 3. 周复盘 & 月复盘

- **周复盘**（≥5 篇日记）：深度分析这一周。提取新的行为观察，加入「近期观察」池。
- **月复盘**（≥15 篇日记）：将反复出现的稳定模式晋升进**核心 Persona**，让不再适用的模式自然退场。
- **年复盘**（≥180 篇日记）：完整人格重建。跨越一整年，看清自己。

每次复盘会自动更新人格版本号（周复盘 +0.1，月复盘 +0.3，年复盘 +1.0） —— 一种安静的方式，标记你改变了多少。

---

## ✨ 核心功能

| 功能 | 说明 |
|---|---|
| 📝 每日日记 | 写日记、选心情，支持补填过去 3 天 |
| 🧠 AI 反思问题 | 每篇日记后，AI 生成个性化的追问 |
| 🛡 情绪检测 | AI 识别情绪异常信号，引导更健康的方向 |
| 👤 活的人格档案 | 持续演化的 Persona，带版本历史 |
| 🔄 周复盘 | 行为模式提取与更新 |
| 📅 月复盘 | 核心人格更新，过时模式退场 |
| 🌍 双语支持 | 完整中英文 —— UI、AI 回复、语音输入全覆盖 |
| 🎙 语音输入 | 浏览器原生 Web Speech API，完全免费 |

---

## 🌱 Roadmap —— 未来升级方向

> **以下功能尚未实现。** 这里记录的是这个产品的长期升级愿景 —— 正在认真思考、但还没有动手构建的方向。

DearDairy 目前是一个早期产品。核心闭环（写日记 → AI 提问 → 复盘 → Persona 进化）已经跑通。以下是它接下来可以走向的地方：

### 🗄 RAG 记忆系统

用向量数据库（RAG）替代当前的扁平化人格存储 —— 这样 AI 可以在对话中调取具体的过去日记片段、行为模式和特定时刻，而不只是依赖一份摘要快照。

### 🧪 更严谨的心理学设计

问卷和 Persona 生成都需要更扎实的理论依据：
- **问卷设计：** 多少题是用户能接受的上限？哪些问题格式能获取最真实、最有用的信息？
- **Persona 的语言：** 如何准确描述一个人的局限性，同时又不让他们看了感到受伤或被贴标签？什么样的表达方式能让人愿意接受关于自己的困难真相，而不是直接关掉页面？
- **CBT 介入机制：** 情绪干预应该是有原则的，而不是随机的。需要设计结构化的对话模式、升级逻辑，以及——更重要的——知道什么时候**不该**介入。

### 🤔 一个哲学问题

这整个项目底下，有一个没有简单答案的问题：

*如果一个 AI 已经观察了你好几年，不断地概括你、塑造你对自己的认知，而你也内化了其中的一部分 —— 那这个新的你，还是你吗？*

这是忒修斯之船（Ship of Theseus）的问题，应用在 AI 时代的身份认同与自我认知上。我们在时间的流水中不断修补自己，最终变成了一个全新的自己 —— 而其中有一部分，是 AI 给的。

DearDairy 没有试图解答这个问题。但它认为这个问题值得陪着你一起坐下来想一想。

---

## 🛠 技术栈

| 层级 | 技术 |
|---|---|
| 前端 | React (Vite), Vanilla CSS, Canvas 极光背景 |
| 后端 | FastAPI (Python), SQLAlchemy |
| 数据库 | Supabase (PostgreSQL) |
| AI | OpenRouter（模型可通过环境变量配置）|
| 认证 | JWT (python-jose + passlib) |

---

## 🚀 快速开始

### 前置条件
- Node.js ≥ 18
- Python ≥ 3.11
- 一个 [Supabase](https://supabase.com) 项目（免费套餐即可）
- 一个 [OpenRouter](https://openrouter.ai) API Key

### 1. 克隆仓库
```bash
git clone https://github.com/yunyan-he/DearDairy.git
cd DearDairy
```

### 2. 后端配置
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # 然后填写你的配置
```

```env
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet    # 或任意 OpenRouter 模型
SUPABASE_URL=postgresql://...                    # 你的 Supabase 连接字符串
SECRET_KEY=your_random_secret_key
```

### 3. 前端配置
```bash
cd frontend
npm install
```

### 4. 本地运行

```bash
# 终端 1 —— 后端
make backend

# 终端 2 —— 前端
make frontend
```

在 Chrome 中打开 **http://localhost:5173**。

---

## 📁 项目结构

```
DearDairy/
├── backend/
│   ├── main.py          # FastAPI 应用，所有 API 路由
│   ├── models.py        # SQLAlchemy 数据模型
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── App.jsx      # 主 React 应用
│       └── i18n.js      # 中英文翻译
└── Makefile             # 快速启动命令
```

---

## 🔑 环境变量

| 变量名 | 说明 |
|---|---|
| `OPENROUTER_API_KEY` | 你的 OpenRouter API Key |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` |
| `OPENROUTER_MODEL` | 任意 OpenRouter 模型标识符 |
| `SUPABASE_URL` | PostgreSQL 连接字符串（Supabase）|
| `SECRET_KEY` | 用于 JWT 签名的随机字符串 |

---

## 🗄 数据库结构

SQLAlchemy 在启动时自动建表：

- **users** — `id`, `username`, `hashed_password`, `api_key`, `usage_count`
- **entries** — `id`, `user_id`, `date`, `content`, `mood`, `question`, `answer`
- **summaries** — `id`, `user_id`, `type`, `content`, `covered_dates`, `created_at`
- **profile_states** — `id`, `user_id`, `profile`, `version`, `summary_history`
- **recent_observations** — `id`, `user_id`, `content`, `created_at`, `last_seen_at`, `times_seen`

---

## 📄 许可证

MIT 

---

*为那些想要诚实地表达、有意识地记录自己的人而做。* ✦
