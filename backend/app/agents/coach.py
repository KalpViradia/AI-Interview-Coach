"""
Coach Agent — runs once at session end.

Input: all evaluations this session + prior reports for user_id
Output: session_summary, weak_topics, roadmap, readiness_label
Side effect: writes final report row to Postgres
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from fastapi import HTTPException
import time
from app.schemas.agent_schemas import InterviewState, SessionReport
from app.core.config import get_settings
from app.core.gemini_retry import with_retry
from app.core.logger import log_agent_execution

settings = get_settings()

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.gemini_api_key,
    temperature=0.2,
    max_retries=2,
)

coach_prompt = PromptTemplate.from_template(
    """You are an expert technical interview coach. Review the following transcript of a mock interview.

Interview Transcript (Q&A and Evaluations):
{transcript}

Historical Scores (from their last up to 5 interviews, chronological):
{historical_scores}

Based on their overall performance across all questions, and using their historical scores to determine momentum:
1. Provide an overall score out of 10.
2. Provide specific scores out of 10 for: Technical Knowledge, Communication, and Problem Solving.
3. Provide a 'readiness_label' (e.g., "Ready for FAANG", "Interview Ready", "Nearly There", "Needs Targeted Practice"). Base this heavily on their score trajectory if historical data exists.
4. Write a brief overall summary of their performance. Mention if they are improving or declining if historical data exists.
5. Identify 2-3 strong topics they excelled at.
6. Identify 2-3 weak topics they should focus on.
(Do not provide a roadmap, that will be handled by a separate agent.)
"""
)

chain = coach_prompt | llm.with_structured_output(SessionReport)

async def report_node(state: InterviewState) -> dict:
    """Report agent: generates final session summary and score."""
    print("Report Agent: Generating session summary...")
    
    evaluations = state.get("evaluations", [])
    
    if not evaluations:
        return {"report": SessionReport(score=0, readiness_label="No Data", summary="No questions answered.", weak_topics=[], roadmap=[]).model_dump()}
        
    # Build transcript
    transcript = ""
    total_score = 0
    for i, ev_dict in enumerate(evaluations):
        # Handle state dictionaries since state is serialized
        question = ev_dict.get("question", "Unknown")
        answer = ev_dict.get("answer", "Unknown")
        score = ev_dict.get("score", 0)
        total_score += score
        
        transcript += f"\n--- Question {i+1} ---\nQ: {question}\nA: {answer}\nScore: {score}/10\n"
        
    avg_score = total_score / len(evaluations) if evaluations else 0

    historical_scores = state.get("historical_scores", [])
    hist_str = ", ".join(map(str, historical_scores)) if historical_scores else "No historical data available."

    try:
        start_time = time.time()
        report: SessionReport = await with_retry(
            chain.ainvoke,
            {
                "transcript": transcript,
                "historical_scores": hist_str
            }
        )
        exec_time = time.time() - start_time
        log_agent_execution(
            session_id="N/A",
            agent_name="Coach Agent",
            execution_time=exec_time,
            model="gemini-2.5-flash",
            success=True,
            final_status="OK"
        )
        return {"report": report.model_dump()}
        
    except HTTPException as e:
        log_agent_execution(
            session_id="N/A",
            agent_name="Coach Agent",
            execution_time=time.time() - start_time if 'start_time' in locals() else 0,
            model="gemini-2.5-flash",
            success=False,
            final_status=f"{e.status_code} {e.detail.get('error', 'ERROR') if isinstance(e.detail, dict) else e.detail}"
        )
        raise e
    except Exception as e:
        log_agent_execution(
            session_id="N/A",
            agent_name="Coach Agent",
            execution_time=time.time() - start_time if 'start_time' in locals() else 0,
            model="gemini-2.5-flash",
            success=False,
            final_status=f"500 UNKNOWN_ERROR: {str(e)}"
        )
        print(f"Report Error: {e}")
        # Robust Dynamic Fallback with predictive scoring
        if historical_scores and len(historical_scores) > 1:
            recent_avg = sum(historical_scores[-2:]) / 2
            if avg_score >= 8.5 and recent_avg >= 8.0:
                readiness = "Ready for FAANG"
            elif avg_score >= 7.5:
                readiness = "Interview Ready"
            elif avg_score >= 6.0 and avg_score > historical_scores[0]:
                readiness = "Nearly There (Improving)"
            else:
                readiness = "Needs Targeted Practice"
        else:
            readiness = "Interview Ready" if avg_score >= 7 else "Needs Practice"
        
        # Extract weak topics
        questions_asked = state.get("questions", [])
        topic_scores = {}
        for q, ev in zip(questions_asked, evaluations):
            topic = q.get("topic", "General")
            score = ev.get("score", 0)
            if topic not in topic_scores:
                topic_scores[topic] = []
            topic_scores[topic].append(score)
            
        avg_topic_scores = {topic: sum(scores)/len(scores) for topic, scores in topic_scores.items()}
        sorted_topics = sorted(avg_topic_scores.keys(), key=lambda t: avg_topic_scores[t])
        weakest_topics = sorted_topics[:2] if sorted_topics else ["General technical concepts"]
        
        summary = f"You completed {len(evaluations)} questions with an average score of {avg_score:.1f}/10."
        
        fallback_report = SessionReport(
            score=round(avg_score, 1),
            technical_score=round(avg_score, 1),
            communication_score=round(max(avg_score - 1, 0), 1),
            problem_solving_score=round(min(avg_score + 1, 10), 1),
            readiness_label=readiness,
            summary=summary,
            strong_topics=sorted_topics[-2:] if len(sorted_topics) >= 2 else ["General effort"],
            weak_topics=weakest_topics,
            roadmap=[] # Handled by roadmap_node
        )
        return {"report": fallback_report.model_dump()}
