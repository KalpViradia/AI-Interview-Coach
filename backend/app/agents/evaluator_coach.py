"""
Merged Evaluator + Coach + Follow-up Agent

Replaces three separate agents (evaluator.py, coach.py/follow_up.py difficulty logic)
with a single Gemini call per answer turn. This reduces Gemini API calls from 3 to 1
per answer submission.

Input state keys (from InterviewState):
    - next_question: dict (the question just answered)
    - user_answer: str
    - evaluations: list[dict] (all past evaluations)
    - questions: list[dict] (all past questions)
    - current_difficulty: int (1-5)
    - turn_count: int

Output state keys:
    - evaluations: [new Evaluation dict] (appended via operator.add)
    - current_difficulty: int (updated)
    - pending_followup_question: dict | None (Question schema) for interviewer_smart
"""

import random
from typing import Optional
from pydantic import BaseModel, Field
from fastapi import HTTPException
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from app.schemas.agent_schemas import InterviewState, Evaluation, Question
from app.core.config import get_settings
from app.core.gemini_retry import with_retry

settings = get_settings()

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.gemini_api_key,
    temperature=0.2,
    max_retries=0,  # We handle retries ourselves via with_retry
)

# Pydantic model for the merged structured output
class EvaluatorCoachOutput(BaseModel):
    score: float = Field(ge=0, le=10, description="Score from 0 to 10")
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    suggestion: str = Field(default="")
    ideal_answer: str = Field(default="")
    new_difficulty: int = Field(ge=1, le=5, description="New difficulty level 1-5")
    needs_followup: bool = Field(default=False)
    followup_question_text: Optional[str] = Field(default=None)

structured_llm = llm.with_structured_output(EvaluatorCoachOutput)

EVALUATOR_COACH_PROMPT = """You are an expert technical interviewer evaluating a candidate's answer.

Question Asked: {question}
Question Topic: {topic}
Current Difficulty Level: {difficulty}/5
Candidate's Answer: {answer}

Recent Interview History (last 3 Q&A scores for context):
{history_summary}

Your tasks:
1. Evaluate the answer thoroughly (score 1-10, strengths, weaknesses, suggestion, ideal_answer).
2. Decide the NEXT difficulty level (1-5 scale):
   - Score >= 8: increase difficulty by 1 (max 5)
   - Score 4-7: keep same difficulty
   - Score <= 3: decrease difficulty by 1 (min 1)
3. Decide if a follow-up question is needed:
   - needs_followup = true ONLY if the answer was dangerously incomplete or missed a CORE concept
   - If needs_followup = true, provide a targeted followup_question_text probing the gap
   - If needs_followup = false, followup_question_text must be null

Output strictly according to the required schema."""

evaluator_coach_prompt = PromptTemplate.from_template(EVALUATOR_COACH_PROMPT)
chain = evaluator_coach_prompt | structured_llm


def _difficulty_adjuster(current_diff: int, score: float) -> int:
    """Deterministic difficulty adjustment as fallback."""
    if score >= 8.0 and current_diff < 5:
        return current_diff + 1
    elif score <= 3.0 and current_diff > 1:
        return current_diff - 1
    return current_diff


async def evaluator_coach_node(state: InterviewState) -> dict:
    """Merged evaluator + difficulty coach agent. One Gemini call per answer turn."""
    print("EvaluatorCoach: Evaluating answer and adjusting difficulty...")

    question_dict = state.get("next_question", {})
    question_text = question_dict.get("text", "Unknown question") if question_dict else "Unknown question"
    question_topic = question_dict.get("topic", "General") if question_dict else "General"
    user_answer = state.get("user_answer", "No answer provided")
    current_diff = state.get("current_difficulty", 1)

    # Handle skip separately — no LLM call needed
    if user_answer == "__SKIP__":
        print("EvaluatorCoach: Question skipped.")
        # Generate ideal answer with a lightweight call
        try:
            ideal_prompt = PromptTemplate.from_template(
                "You are an expert technical interviewer. The candidate skipped this question:\n\n"
                "{question}\n\nProvide a concise, highly effective ideal answer."
            )
            ideal_chain = ideal_prompt | llm
            ideal_result = await with_retry(ideal_chain.ainvoke, {"question": question_text})
            ideal_answer_text = ideal_result.content
        except Exception:
            ideal_answer_text = "An ideal answer would directly address the core concepts required."

        skipped_eval = Evaluation(
            question=question_text,
            answer="[SKIPPED]",
            score=0.0,
            strengths=[],
            weaknesses=["Question was skipped."],
            suggestion="Try to answer this question next time to maximize your score.",
            ideal_answer=ideal_answer_text,
        )
        return {
            "evaluations": [skipped_eval.model_dump()],
            "current_difficulty": max(1, current_diff - 1),
            "pending_followup_question": None,
        }

    # Build history summary (last 3 evaluations)
    past_evals = state.get("evaluations", [])
    past_questions = state.get("questions", [])
    recent_pairs = list(zip(past_questions[-3:], past_evals[-3:]))
    history_summary = "\n".join(
        f"Q: {q.get('text', '')[:60]}... | Score: {e.get('score', 'N/A')}"
        for q, e in recent_pairs
    ) or "First question in this session."

    try:
        result: EvaluatorCoachOutput = await with_retry(
            chain.ainvoke,
            {
                "question": question_text,
                "topic": question_topic,
                "difficulty": current_diff,
                "answer": user_answer,
                "history_summary": history_summary,
            }
        )

        evaluation = Evaluation(
            question=question_text,
            answer=user_answer,
            score=result.score,
            strengths=result.strengths,
            weaknesses=result.weaknesses,
            suggestion=result.suggestion,
            ideal_answer=result.ideal_answer,
        )

        # Build follow-up question dict if needed
        pending_followup = None
        if result.needs_followup and result.followup_question_text:
            follow_up_q = Question(
                text=result.followup_question_text,
                topic=question_topic,
                difficulty=current_diff,
                is_follow_up=True,
            )
            pending_followup = follow_up_q.model_dump()

        return {
            "evaluations": [evaluation.model_dump()],
            "current_difficulty": result.new_difficulty,
            "pending_followup_question": pending_followup,
        }

    except HTTPException as e:
        # Re-raise explicit HTTPExceptions (like 429 from with_retry)
        raise e
    except Exception as e:
        # This will only be hit if it's a non-429 error
        print(f"EvaluatorCoach Error: {e}")

        # Length-based heuristic fallback
        words = len(user_answer.split())
        if words < 10:
            score, strengths, weaknesses, suggestion = (
                3.0,
                ["Attempted to answer."],
                ["Answer is far too short and lacks detail."],
                "Elaborate much more on your technical choices and reasoning.",
            )
        elif words < 30:
            score, strengths, weaknesses, suggestion = (
                5.0,
                ["Provided a solid basic response."],
                ["Could use more depth and specific examples."],
                "Try to use the STAR method to structure your answer with more context.",
            )
        else:
            score, strengths, weaknesses, suggestion = (
                7.0,
                ["Detailed and comprehensive response provided."],
                ["May lack precise technical depth depending on the question."],
                "Keep providing detailed answers, focusing on 'why' you made certain decisions.",
            )

        fallback_eval = Evaluation(
            question=question_text,
            answer=user_answer,
            score=score,
            strengths=strengths,
            weaknesses=weaknesses,
            suggestion=suggestion,
            ideal_answer=f"An ideal answer would directly address {question_topic} with specific examples and metrics.",
        )
        return {
            "evaluations": [fallback_eval.model_dump()],
            "current_difficulty": _difficulty_adjuster(current_diff, score),
            "pending_followup_question": None,
        }
