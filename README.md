# DearDairy 🌙

> *A private AI-powered journal that grows alongside you.*

**[中文版 README →](./README.zh-CN.md)**

---

DearDairy is more than a journaling app. It's a **long-term growth companion** — a system designed to track not just what you wrote, but who you are becoming.

The core idea: your personality isn't static. Every week, every month, your patterns shift. DearDairy builds a **living personality profile (Persona)** that evolves with every entry, every weekly review, every monthly retrospective — so you can watch yourself change over time, with the clarity that only a consistent outside observer can offer.

---

## 🧭 The User Journey

DearDairy is designed as a complete growth loop:

```
First Launch → Onboarding Quiz → Initial Persona Generated
     ↓
Daily Journaling (with AI reflection + emotional check-in)
     ↓
Weekly Review → Recent behavior patterns extracted → Persona updated
     ↓
Monthly Review → Stable patterns promoted into Core Persona → Outdated patterns retired
     ↓
Yearly Review → Full persona reconstruction → See how far you've come
```

### 1. Onboarding — Get to Know Yourself First

Before you write a single entry, DearDairy asks you a short **psychological onboarding quiz**. This isn't a generic Myers-Briggs clone — it's designed to surface your current self-understanding across key dimensions: how you handle stress, what motivates you, where you tend to get stuck.

The output: your **Initial Persona** — a structured profile of who you appear to be *right now*. This becomes the baseline everything else is measured against.

### 2. Daily Journaling

Write your entry. Pick a mood. That's it.

After each entry, the AI generates a **tailored reflection question** based on your content *and* your current persona — not a generic prompt, but something that speaks to your specific patterns and open questions.

**Emotional safety net:** If the AI detects signs of emotional distress or persistent negative spiraling, it doesn't just ask another question — it gently shifts the conversation toward something more grounding. *(A more principled CBT-informed intervention system is a planned future direction — see Roadmap.)*

### 3. Weekly & Monthly Reviews

- **Weekly review** (≥5 entries): Deep analysis of your week. Extracts new behavioral observations and adds them to your Recent Observations pool.
- **Monthly review** (≥15 entries): Promotes stable, recurring observations into your **Core Persona**. Retires patterns that no longer apply.
- **Yearly review** (≥180 entries): Full persona reconstruction. A chance to see yourself clearly across a full year.

Each review bumps your profile version (`weekly +0.1`, `monthly +0.3`, `yearly +1.0`) — a quiet way of marking how much has changed.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📝 Daily Journal | Write entries, pick mood, backdate up to 3 days |
| 🧠 AI Reflection | Personalized follow-up question after each entry |
| 🛡 Emotional Check-in | AI detects distress signals, guides toward reflection |
| 👤 Living Persona | Evolving personality profile with versioned history |
| 🔄 Weekly Review | Behavioral pattern extraction |
| 📅 Monthly Review | Core persona updates, pattern retirement |
| 🌍 Bilingual | Full EN / ZH support — UI, AI prompts, voice input |
| 🎙 Voice Input | Browser-native Web Speech API, no cost |

---

## 🌱 Roadmap — Future Directions

> **These features are not yet implemented.** The following represents the product's longer-term upgrade vision — directions the project is actively thinking about, but has not yet built.

DearDairy is an early-stage product. The core loop (journaling → AI reflection → reviews → Persona) is working. What follows is where it could go next:

### 🗄 RAG-based Memory
Replace the current flat profile system with a vector database (RAG) approach — so the AI can surface specific past entries, patterns, and moments in context, rather than working only from a summarized profile snapshot.

### 🧪 Rigorous Psychological Design
The onboarding quiz and persona generation need more careful grounding:
- **Quiz design:** How many questions are too many before users drop off? Which question formats yield the most honest, useful responses?
- **Persona language:** How do you describe someone's shadow traits accurately without making them feel judged or labeled? What framing helps people engage with difficult self-observations rather than reject them?
- **CBT integration:** The emotional intervention system should be principled, not improvised. This means structured dialogue patterns, escalation logic, and knowing when *not* to intervene.

### 🤔 A Philosophical Thread

There's a question underneath all of this that doesn't have a clean answer:

*If an AI has been observing you, summarizing you, and shaping how you see yourself for years — and you've internalized some of that — are the new parts of you still... you?*

This is the [Ship of Theseus](https://en.wikipedia.org/wiki/Ship_of_Theseus) problem, applied to identity and self-knowledge in the age of AI. DearDairy doesn't try to resolve it. But it thinks it's worth sitting with.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Vanilla CSS, Canvas aurora background |
| Backend | FastAPI (Python), SQLAlchemy |
| Database | Supabase (PostgreSQL) |
| AI | OpenRouter (model configurable via env) |
| Auth | JWT (python-jose + passlib) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.11
- A [Supabase](https://supabase.com) project (free tier works)
- An [OpenRouter](https://openrouter.ai) API key

### 1. Clone the repo
```bash
git clone https://github.com/yunyan-he/DearDairy.git
cd DearDairy
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in your credentials
```

```env
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet    # or any OpenRouter model
SUPABASE_URL=postgresql://...                    # your Supabase connection string
SECRET_KEY=your_random_secret_key
```

### 3. Frontend setup
```bash
cd frontend
npm install
```

### 4. Run locally

```bash
# Terminal 1 — backend
make backend

# Terminal 2 — frontend
make frontend
```

Open **http://localhost:5173** in Chrome.

---

## 📁 Project Structure

```
DearDairy/
├── backend/
│   ├── main.py          # FastAPI app, all API routes
│   ├── models.py        # SQLAlchemy models
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── App.jsx      # Main React app
│       └── i18n.js      # EN/ZH translations
└── Makefile             # Quick-start commands
```

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `OPENROUTER_API_KEY` | Your OpenRouter API key |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` |
| `OPENROUTER_MODEL` | Any model slug from OpenRouter |
| `SUPABASE_URL` | PostgreSQL connection string (Supabase) |
| `SECRET_KEY` | Random string for JWT signing |

---

## 🗄 Database Schema

Tables are auto-created on startup via SQLAlchemy:

- **users** — `id`, `username`, `hashed_password`, `api_key`, `usage_count`
- **entries** — `id`, `user_id`, `date`, `content`, `mood`, `question`, `answer`
- **summaries** — `id`, `user_id`, `type`, `content`, `covered_dates`, `created_at`
- **profile_states** — `id`, `user_id`, `profile`, `version`, `summary_history`
- **recent_observations** — `id`, `user_id`, `content`, `created_at`, `last_seen_at`, `times_seen`

---

## 📄 License

MIT — do whatever you want with it.

---

*Built for anyone who wants to express honestly and record  intentionally.* ✦
