# 🎯 AI Interview Coach

> An intelligent interview preparation platform powered by AI.

🌐 [Live Demo](#) | 🎥 [Demo Video](#)

[![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-orange)](https://langchain-ai.github.io/langgraph/)
[![Gemini](https://img.shields.io/badge/Gemini-4285F4?logo=google)](https://deepmind.google/technologies/gemini/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?logo=python)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## ✨ What It Does

AI Interview Coach is a full-stack application that simulates a real technical job interview. Unlike static flashcard apps, it:

- **Analyzes your resume and job description** to create a personalized candidate profile
- **Adapts question difficulty in real time** based on how well you answer (1–5 scale)
- **Gives detailed per-question feedback** — score, strengths, weaknesses, and an ideal answer
- **Generates a final report** with an overall score, Interview Readiness Badge, and a learning roadmap
- **Checks your ATS score** — how well your resume matches the job description keyword-by-keyword

---

## 📸 Screenshots

*Replace the placeholders with actual image paths*

- **Landing Page**: `![Landing Page](path/to/landing.png)`
- **ATS Analysis**: `![ATS Analysis](path/to/ats.png)`
- **Interview Screen**: `![Interview Screen](path/to/interview.png)`
- **Final Report**: `![Final Report](path/to/report.png)`
- **Dashboard**: `![Dashboard](path/to/dashboard.png)`

---

## 🚀 Features

### Resume Intelligence
- Resume Analysis
- ATS Score
- Missing Skills
- Resume Chat

### AI Interview
- Adaptive Mock Interviews
- Personalized Questions
- Follow-up Questions
- Difficulty Adjustment

### Reports
- Interview Feedback
- Learning Roadmap
- Dashboard
- Progress Tracking

### Authentication
- Guest Mode
- Secure Login
- Saved Interview History

---

## 🗺️ Architecture

```text
Resume + JD
↓
Resume Analysis
↓
Knowledge Retrieval
↓
Interview Generation
↓
Answer Evaluation
↓
Final Report
```

---

## 📁 Project Structure

```text
AI Interview Coach
│
├── frontend
│   ├── app
│   ├── components
│   ├── hooks
│   ├── lib
│   └── public
│
├── backend
│   ├── agents
│   ├── api
│   ├── core
│   ├── database
│   ├── models
│   ├── services
│   ├── tools
│   └── main.py
│
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js, React, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | FastAPI, Python, SQLAlchemy, Alembic |
| **AI Orchestration** | LangGraph, LangChain |
| **LLM** | Google Gemini 2.5 Flash |
| **Vector Store** | ChromaDB (local) |
| **Database** | PostgreSQL (via Neon) |
| **Auth** | NextAuth.js |

---

## 🔐 Environment Variables

Configure your environment variables using the provided `.env.example` files.

1. Copy the example `.env` files in both directories:
   - Frontend: Copy `frontend/.env.example` to `frontend/.env.local`
   - Backend: Copy `backend/.env.example` to `backend/.env`
2. Fill in the required values (like your LLM Provider API Key and database credentials).
3. Start the application following the setup instructions below.

---

## ⚙️ Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL
- API credentials for your chosen LLM provider

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

alembic upgrade head
python run.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🔮 Future Enhancements

- Voice Interviews
- Company-specific interview packs
- Multi-language support
- AI Interview Analytics
