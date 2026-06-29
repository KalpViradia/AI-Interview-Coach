# 🎯 AI Interview Coach

> An intelligent, adaptive mock interview platform powered by **Google Gemini** and **LangGraph**, built for Kaggle's AI for Education challenge.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.2-orange)](https://langchain-ai.github.io/langgraph/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?logo=google)](https://deepmind.google/technologies/gemini/)

---

## ✨ What It Does

AI Interview Coach is a full-stack application that simulates a real technical job interview. Unlike static flashcard apps, it:

- **Analyzes your resume and job description** to create a personalized candidate profile
- **Adapts question difficulty in real time** based on how well you answer (1–5 scale)
- **Gives detailed per-question feedback** — score, strengths, weaknesses, and an ideal answer
- **Generates a final report** with an overall score, readiness badge, and a learning roadmap
- **Checks your ATS score** — how well your resume matches the job description keyword-by-keyword

---

## 🗺️ Architecture

### AI Agent Workflow

The system uses a structured state machine with distinct AI nodes to manage the interview lifecycle:

1. **Analyzer Node**: Extracts skills, gaps, and an ATS score from your resume and job description.
2. **Interviewer Node**: Generates personalized questions based on your background and the target role.
3. **Wait for Answer (Human-in-the-Loop)**: Pauses execution to wait for user input.
4. **Evaluator Coach Node**: Scores your answer, adjusts upcoming question difficulty, and determines if a follow-up is needed.
5. **Report Node**: Generates a final session summary and readiness label.
6. **Roadmap Node**: Creates a personalized 5-step learning roadmap based on overall performance.

**Optimization**: The architecture achieves high efficiency by merging evaluator and coach responsibilities into a single LLM call per turn.

---

## 🚀 Features

### Core Interview Engine
- Adaptive Difficulty — questions scale from Easy to Hard based on your performance
- Follow-up Questions — if you miss a core concept, the AI probes deeper (zero extra API calls)
- Smart Question Generation — questions reference your actual resume projects
- ChromaDB RAG — retrieves relevant seed questions from a curated question bank as context
- Skip & End Early — flexible session control


### ATS Resume Analysis
- Hybrid ATS scoring — keyword overlap + semantic similarity + experience + quality
- Missing skills breakdown — shows exactly what the JD requires that your resume lacks
- SHA-256 caching — same resume+JD = instant cached result, no extra Gemini call

### Results & Analytics
- Interview Readiness Badge — 5-star rating (Not Ready to Exceptional)
- Per-question feedback — score, strengths, weaknesses, ideal answer
- Personalized 5-step learning roadmap
- Dashboard with historical scores — track improvement over time
- Resume chat (RAG) — ask questions about your resume vs. the JD

### Infrastructure
- PostgreSQL persistence via SQLAlchemy (authenticated sessions saved permanently)
- LangGraph Postgres checkpointer — resume interrupted interviews
- NextAuth.js — email/password + guest mode
- Exponential backoff retry — 429 rate limits handled automatically (2s, 4s, 8s, 16s)
- Rate limiting — SlowAPI (10 req/min per IP)

---

## 📁 Project Structure

```
AI Interview Coach/
├── backend/
│   └── app/
│       ├── agents/
│       │   ├── analyzer.py           # Resume+JD → candidate_profile (cached)
│       │   ├── evaluator_coach.py    # Merged evaluator + difficulty coach
│       │   ├── interviewer_smart.py  # Merged interviewer + follow-up
│       │   ├── coach.py              # Final report generator
│       │   ├── roadmap.py            # Learning roadmap generator
│       │   └── graph.py              # LangGraph StateGraph wiring
│       ├── api/
│       │   ├── sessions.py           # POST /sessions, POST /sessions/{id}/answer
│       │   ├── analysis.py           # POST /analyze-resume (ATS)
│       │   └── dashboard.py          # GET /dashboard/stats
│       ├── core/
│       │   ├── gemini_retry.py       # Exponential backoff for 429 errors
│       │   └── config.py             # Pydantic Settings
│       ├── models/                   # SQLAlchemy ORM models
│       ├── services/
│       │   └── ats_scoring.py        # Hybrid ATS algorithm
│       └── tools/
│           └── vector_store.py       # ChromaDB question retrieval
│
├── frontend/
│   └── app/
│       ├── page.tsx                  # Landing page
│       ├── upload/page.tsx           # Resume + JD upload
│       ├── analysis/page.tsx         # ATS analysis results
│       ├── interview/page.tsx        # Live interview
│       ├── report/page.tsx           # Final report + readiness badge
│       ├── dashboard/page.tsx        # Historical analytics
│       └── resume-chat/page.tsx      # RAG chat about resume
│
└── Docs/
    └── project_walkthrough.md        # Full feature + route documentation
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | FastAPI, Python 3.11, SQLAlchemy, Alembic |
| **AI Orchestration** | LangGraph 0.2, LangChain |
| **LLM** | Google Gemini 2.5 Flash |
| **Vector Store** | ChromaDB (local) |
| **Database** | PostgreSQL (via Neon) |
| **Auth** | NextAuth.js v5 |

---

## 🔐 Environment Variables

Before running the application, you must configure the environment variables:

1. Copy the example `.env` files in both directories:
   - Frontend: Copy `frontend/.env.example` to `frontend/.env.local`
   - Backend: Copy `backend/.env.example` to `backend/.env`
2. Fill in the required values (like your `GEMINI_API_KEY` and `DATABASE_URL`).
3. Start the application following the setup instructions below.

---

## ⚙️ Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (or Neon free tier)
- Google Gemini API key (free tier works)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Create .env file
# Copy backend/.env.example to backend/.env and fill in the required values.

alembic upgrade head
python run.py
```

### Frontend
```bash
cd frontend
npm install

# Create .env.local
# Copy frontend/.env.example to frontend/.env.local and fill in the required values.

npm run dev
```

---

## 📊 API Rate Limit Resilience

| Optimization | Savings |
|---|---|
| Merged EvaluatorCoach agent | 3 calls → 1 per answer |
| Merged InterviewerSmart (follow-up reuse) | 2 calls → 1 per question |
| ATS result cache (SHA-256 keyed) | Analyzer call = 0 on repeat |
| Exponential backoff retry | Absorbs brief rate spikes |
| **Total per turn** | **5 calls → 2 calls** |

---

## 📄 License

MIT — built for the Kaggle AI for Education Challenge.
