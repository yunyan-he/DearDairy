# DearDairy 🌙

> *A private AI-powered journal that grows to understand you.*

DearDairy is a web-based journaling app that pairs your daily writing with an AI companion that genuinely gets to know you over time. Unlike generic AI tools, DearDairy builds a **living personality profile** that evolves with every entry — shaping how the AI asks questions, gives feedback, and reviews your growth.

---

## ✨ Features

### 📝 Daily Journaling
- Write your entry, pick a mood, and save
- **Backdate** entries for up to 3 days you missed
- Clean, distraction-free writing experience

### 🤖 Personalized AI Reflection
- After each entry, the AI generates a **tailored reflection question** based on your content and personality profile
- Questions are warm and direct — designed to spark thought, not anxiety

### 🧠 AI Reviews
- **Weekly review** (≥5 entries) — deep analysis of your week + extracts new personality observations
- **Monthly review** (≥15 entries) — promotes stable observations into your core profile, expires outdated ones
- **Yearly review** (≥180 entries) — full profile reconstruction
- Profile versioning: each review bumps the version (weekly +0.1, monthly +0.3, yearly +1.0)

### 👤 Personality Profile System
- **Core profile** — structured in 4 sections: Core Traits, Main Struggles, Growth Drivers & Obstacles, Interaction Principles
- **Recent Observations** — short-lived insights (60-day TTL) that get promoted to core or expire
- Fully AI-driven, built from your onboarding answers and diary entries over time

### 🌍 Bilingual — English & Chinese
- Language selected once at first launch; stored locally
- All UI, AI prompts, and responses adapt to your chosen language
- Voice input language (`zh-CN` / `en-US`) switches automatically

### 🎙 Voice Input
- Browser-native Web Speech API — completely free, no API key needed
- Works in Chrome and Edge

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
```

Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
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

Use the included Makefile from the project root:
```bash
# Terminal 1 — backend
make backend

# Terminal 2 — frontend
make frontend
```

Then open **http://localhost:5173** in Chrome.

---

## 📁 Project Structure

```
DearDairy/
├── backend/
│   ├── main.py          # FastAPI app, all API routes
│   ├── models.py        # SQLAlchemy models (User, Entry, Summary, ProfileState, RecentObservation)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── App.jsx      # Main React app (~1800 lines)
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

*Built for anyone who wants to write honestly and grow intentionally.* ✦
