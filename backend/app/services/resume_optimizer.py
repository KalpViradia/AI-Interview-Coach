"""
Resume Optimizer Service for AI-driven resume enhancements.
"""

import json
import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

from app.core.config import get_settings
from app.schemas.resume_studio_schemas import OptimizeResponse

logger = logging.getLogger(__name__)
settings = get_settings()

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.gemini_api_key,
    temperature=0.4,
)

# Prompts for different optimization actions
ACTION_PROMPTS = {
    "improve_summary": "Rewrite this resume summary to be more impactful, professional, and concise. Highlight key strengths.",
    "rewrite_bullets": "Rewrite these experience bullet points. Start with strong action verbs, focus on achievements rather than duties, and make them more compelling.",
    "quantify_achievements": "Rewrite these bullet points by adding hypothetical placeholder metrics (e.g., [X]%, $ [Y]) where appropriate so the candidate knows where to quantify their impact.",
    "improve_ats_keywords": "Rewrite this text to naturally incorporate industry-standard keywords while maintaining readability. Context: {context}",
    "make_concise": "Edit this text to be as concise and punchy as possible without losing the core meaning.",
    "better_action_verbs": "Replace weak or repetitive verbs in this text with strong, varied action verbs (e.g., spearheaded, architected, orchestrated)."
}

OPTIMIZE_TEMPLATE = """
You are an expert executive resume writer.
Task: {task_instruction}

Original Text:
{original_text}

Return your response as a JSON object strictly matching this schema:
{{
    "improved": "The newly rewritten text. For bullet points, use '- ' for each item.",
    "changes_summary": "A 1-sentence summary of what you changed and why."
}}
"""

async def optimize_section(action: str, section_text: str, context: str = "") -> OptimizeResponse:
    """Optimizes a specific section of text based on the requested action."""
    
    if action not in ACTION_PROMPTS:
        raise ValueError(f"Invalid optimization action: {action}")
        
    task_instruction = ACTION_PROMPTS[action]
    if "{context}" in task_instruction:
        task_instruction = task_instruction.replace("{context}", context or "General industry standards")

    try:
        prompt = ChatPromptTemplate.from_template(OPTIMIZE_TEMPLATE)
        chain = prompt | llm
        
        response = await chain.ainvoke({
            "task_instruction": task_instruction,
            "original_text": section_text
        })
        
        text = response.content.strip()
        
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
            
        data = json.loads(text)
        
        return OptimizeResponse(
            original=section_text,
            improved=data.get("improved", section_text),
            action=action,
            changes_summary=data.get("changes_summary", "")
        )
        
    except Exception as e:
        logger.error(f"Failed to optimize section: {e}")
        return OptimizeResponse(
            original=section_text,
            improved=section_text,
            action=action,
            changes_summary="Optimization failed. Please try again."
        )
