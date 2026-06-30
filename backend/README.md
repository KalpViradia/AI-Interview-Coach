# AI Interview Coach - Backend

This is the FastAPI backend for the AI Interview Coach. It serves as the core orchestration layer, using LangGraph to manage the state of an interview and interact with the Gemini API to analyze resumes and conduct mock interviews.

## Setup Instructions

1. Ensure you have Python 3.10+ installed.
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up your environment variables by copying `.env.example` to `.env` and filling in the necessary values (all required variables are listed in `.env.example`).
5. Run database migrations:
   ```bash
   alembic upgrade head
   ```
6. Seed the vector database with the initial set of interview questions (run once):
   ```bash
   python -m app.scripts.seed_chroma
   ```
7. Start the backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

The API will be running at `http://localhost:8000`. You can access the automatic interactive API documentation at `http://localhost:8000/docs`.

## Key Technologies

- **FastAPI**: The web framework used to build the API.
- **LangGraph**: Used to construct the multi-agent system (Analyzer, Interviewer, Evaluator, Coach).
- **PostgreSQL & SQLAlchemy**: The relational database used to store users, sessions, questions, answers, and reports.
- **ChromaDB**: The vector database used to retrieve relevant questions during the interview.
- **LLM Provider**: The underlying LLM used for text generation, extraction, and evaluation.


