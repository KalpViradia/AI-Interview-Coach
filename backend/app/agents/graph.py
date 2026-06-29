"""
LangGraph StateGraph definition — Optimized 2-agent-per-turn architecture.

Wires together all agents with a Postgres checkpointer keyed by session_id.

Flow:
  START → analyzer → interviewer_smart → wait_for_answer (interrupt)
                             ↑
                  evaluator_coach ← (after each answer)
                       ↓ (turn >= 10 OR __END_INTERVIEW__)
               report_node → roadmap_node → END

Gemini calls per turn: 5 (old) → 2 (new):
  - evaluator_coach: 1 call (evaluates + decides follow-up + adjusts difficulty)
  - interviewer_smart: 1 call for new questions, 0 calls for follow-ups
"""

from langgraph.graph import StateGraph, START, END
from langgraph.types import interrupt, Command
from typing import Literal

from app.schemas.agent_schemas import InterviewState
from app.agents.analyzer import analyzer_node
from app.agents.interviewer_smart import interviewer_smart_node
from app.agents.evaluator_coach import evaluator_coach_node
from app.agents.coach import report_node
from app.agents.roadmap import roadmap_node


def wait_for_answer(state: InterviewState) -> dict:
    """Human-in-the-loop node: pauses the graph and waits for user's answer."""
    user_answer = interrupt("Please provide your answer to the question.")
    return {"user_answer": user_answer}


def route_after_answer(state: InterviewState) -> Literal["evaluator_coach", "report_node"]:
    """If the user chose to end the interview early, skip evaluation and go to report."""
    if state.get("user_answer") == "__END_INTERVIEW__":
        return "report_node"
    return "evaluator_coach"


def route_after_evaluator_coach(
    state: InterviewState,
) -> Literal["interviewer_smart", "report_node"]:
    """Determine if we should ask another question or finish the session."""
    turn = state.get("turn_count", 0)
    if turn >= 10:
        return "report_node"
    return "interviewer_smart"


# Build the graph
builder = StateGraph(InterviewState)

# Add nodes
builder.add_node("analyzer", analyzer_node)
builder.add_node("interviewer_smart", interviewer_smart_node)
builder.add_node("wait_for_answer", wait_for_answer)
builder.add_node("evaluator_coach", evaluator_coach_node)
builder.add_node("report_node", report_node)
builder.add_node("roadmap_node", roadmap_node)

# Add edges
builder.add_edge(START, "analyzer")
builder.add_edge("analyzer", "interviewer_smart")
builder.add_edge("interviewer_smart", "wait_for_answer")

# After user submits answer: end early or evaluate
builder.add_conditional_edges("wait_for_answer", route_after_answer)

# After evaluation: next question or final report
builder.add_conditional_edges(
    "evaluator_coach",
    route_after_evaluator_coach,
    {
        "interviewer_smart": "interviewer_smart",
        "report_node": "report_node",
    },
)

builder.add_edge("report_node", "roadmap_node")
builder.add_edge("roadmap_node", END)

# Compiled in main.py lifespan with the Postgres checkpointer instance
