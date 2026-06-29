"""
Roadmap Agent — runs after the report agent.
Takes the weak topics identified by the report agent and builds a highly detailed,
step-by-step learning roadmap.

Input: report (with weak_topics)
Output: Updates report with a roadmap list.
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from fastapi import HTTPException
from app.schemas.agent_schemas import InterviewState
from app.core.config import get_settings
from app.core.gemini_retry import with_retry
import json

settings = get_settings()

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.gemini_api_key,
    temperature=0.3,
    max_retries=2,
)

ROADMAP_PROMPT = """You are an expert technical interview coach creating a study plan.

The candidate applied for the following job:
Job Description:
{jd}

The candidate just completed a mock interview and struggled with the following topics:
{weak_topics}

Task:
Create a highly detailed, step-by-step learning roadmap for the candidate to improve in these specific areas over the next 2 weeks.
Your roadmap MUST be tailored to the requirements of the Job Description. If they failed on a generic concept, explain how it applies specifically to the tools/frameworks mentioned in the Job Description.

CRITICAL FORMATTING INSTRUCTION: 
If a roadmap step contains multiple sub-points, tasks, or actionable items, you MUST use proper Markdown bullet points and actual new lines (e.g., `\\n- Task 1\\n- Task 2`). Do not clump them into a single paragraph. The text needs to be highly readable.

Provide the output as a clean JSON array of strings. 
DO NOT include any markdown code blocks like ```json around the array.
Just return the raw array of strings.
Example:
[
  "**Week 1: Focus on studying X by doing Y.**\\n- Read the official docs for X.\\n- Build a small prototype.\\n- Practice explaining it out loud.",
  "**Week 2: Advanced Application**\\n- Apply your knowledge to Z.\\n- Complete 3 medium LeetCode problems."
]
"""

roadmap_prompt = PromptTemplate.from_template(ROADMAP_PROMPT)

chain = roadmap_prompt | llm

async def roadmap_node(state: InterviewState) -> dict:
    """Roadmap agent: generates the learning roadmap based on weak topics."""
    print("Roadmap Agent: Generating detailed study roadmap...")
    
    report = state.get("report")
    if not report:
        return {"report": None}
        
    weak_topics = report.get("weak_topics", [])
    if not weak_topics:
        # Fallback if there are no weak topics
        report["roadmap"] = [
            "Great job! You didn't show any major weaknesses.",
            "Keep practicing advanced scenarios to maintain your edge."
        ]
        return {"report": report}
        
    weak_topics_str = ", ".join(weak_topics)
    jd_text = state.get("jd_text", "")
    
    try:
        response = await with_retry(
            chain.ainvoke,
            {"weak_topics": weak_topics_str, "jd": jd_text}
        )
        text = response.content.strip()
        
        # Clean up if the model accidentally included markdown
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        roadmap = json.loads(text.strip())
        if isinstance(roadmap, list):
            report["roadmap"] = roadmap
        else:
            raise ValueError("Output was not a list")
            
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Roadmap Error: {e}")
        # Robust Fallback
        report["roadmap"] = [
            f"Review theoretical concepts related to {weak_topics[0]}.",
            f"Build a small project that heavily utilizes {weak_topics[0]}.",
            "Schedule another mock interview focusing on these topics next week."
        ]
        
    return {"report": report}
