"""
Analyzer Agent — runs once at session start.

Input: resume_text, jd_text
Output: candidate_profile = { skills, projects, experience_level, gaps_vs_jd }
"""

import os
from fastapi import HTTPException
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from app.schemas.agent_schemas import InterviewState, CandidateProfile
from app.services.ats_scoring import calculate_final_ats_breakdown
from app.core.config import get_settings
from app.core.gemini_retry import with_retry
from app.core.logger import log_agent_execution
import time

settings = get_settings()

# Initialize Gemini
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.gemini_api_key,
    temperature=0.2,
    max_retries=2,
)

structured_llm = llm.with_structured_output(CandidateProfile, include_raw=True)

SYSTEM_PROMPT = """You are an expert technical recruiter and AI Interview Coach.
Your task is to analyze a candidate's resume and a target job description (JD).
Extract the candidate's core skills, key projects, their overall experience level, and identify any major skill gaps when compared to the job description.

For `experience_level`, provide ONLY a concise 1-3 word label (e.g., Fresher, Intern, Entry Level, Mid-Level, Senior).
For `experience_details`, provide a detailed explanation of their background (education, graduation dates, work duration, etc.) justifying the label.

Output this information strictly according to the required schema."""

analyzer_prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", "Resume:\n{resume}\n\nJob Description:\n{jd}")
])

chain = analyzer_prompt | structured_llm

async def analyzer_node(state: InterviewState) -> dict:
    """Analyzer agent: extracts candidate profile from resume and JD."""
    
    # Short-circuit if candidate_profile is already set (cache hit from sessions.py)
    if state.get("candidate_profile"):
        print("Analyzer: Skipping — candidate_profile already set from cache.")
        return {}
    
    print("Analyzer: Processing resume and JD...")
    
    resume_text = state.get("resume_text", "")
    jd_text = state.get("jd_text", "")
    
    try:
        start_time = time.time()
        gemini_res = await with_retry(chain.ainvoke, {
            "resume": resume_text,
            "jd": jd_text
        })
        profile: CandidateProfile = gemini_res.data
        
        # Calculate Hybrid ATS Score only if a JD is provided
        if jd_text.strip():
            breakdown = await calculate_final_ats_breakdown(resume_text, jd_text)
            profile.ats_breakdown = breakdown
        
        exec_time = time.time() - start_time
        log_agent_execution(
            session_id="N/A", # Will be mapped at higher level if needed
            agent_name="Analyzer Agent",
            execution_time=exec_time,
            model="gemini-2.5-flash",
            prompt_tokens=gemini_res.input_tokens,
            completion_tokens=gemini_res.output_tokens,
            success=True,
            final_status="OK"
        )
        return {"candidate_profile": profile.model_dump()}
    except HTTPException as e:
        log_agent_execution(
            session_id="N/A",
            agent_name="Analyzer Agent",
            execution_time=time.time() - start_time if 'start_time' in locals() else 0,
            model="gemini-2.5-flash",
            success=False,
            final_status=f"{e.status_code} {e.detail.get('error', 'ERROR') if isinstance(e.detail, dict) else e.detail}"
        )
        raise e
    except Exception as e:
        log_agent_execution(
            session_id="N/A",
            agent_name="Analyzer Agent",
            execution_time=time.time() - start_time if 'start_time' in locals() else 0,
            model="gemini-2.5-flash",
            success=False,
            final_status=f"500 UNKNOWN_ERROR: {str(e)}"
        )
        print(f"Analyzer Error: {e}")
        # Smart fallback: If the user's Gemini API key is broken or rate-limited, manually extract skills
        common_skills = [
            "python", "java", "c++", "go", "golang", "javascript", "typescript", "react", "next.js", "angular", "vue",
            "node.js", "express", "django", "flask", "fastapi", "spring boot", "ruby on rails", "php", "laravel",
            "d3.js", "jest", "cypress", "mocha", "chai", "selenium", "playwright",
            "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "ansible", "jenkins", "github actions",
            "postgres", "postgresql", "sql", "mysql", "oracle", "sql server", "sqlite",
            "nosql", "redis", "mongodb", "cassandra", "dynamodb", "elasticsearch",
            "kafka", "rabbitmq", "activemq", "spark", "hadoop", "airflow", "snowflake", "databricks",
            "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn", "keras", "xgboost",
            "nlp", "natural language processing", "computer vision", "recommendation systems", "data visualization",
            "pandas", "numpy", "matplotlib", "seaborn", "statistics", "feature engineering", "mlops",
            "html", "css", "tailwind", "sass", "less", "redux", "graphql", "rest", "api", "git", "linux"
        ]
        
        found_skills = [s for s in common_skills if s in resume_text.lower()]
        jd_skills = [s for s in common_skills if s in jd_text.lower()]
        
        found_skills_formatted = [s.title() if len(s) > 3 else s.upper() for s in found_skills]
        jd_skills_formatted = [s.title() if len(s) > 3 else s.upper() for s in jd_skills]
        
        gaps = [s for s in jd_skills_formatted if s not in found_skills_formatted]
        
        fallback_profile = CandidateProfile(
            skills=found_skills_formatted if found_skills_formatted else ["General Engineering"],
            projects=["Projects matching skills" if found_skills else "General Projects"],
            experience_level="Mid-Level Professional",
            gaps_vs_jd=gaps if gaps else ["No significant gaps found"]
        )
        
        # Use our deterministic ATS engine even in fallback mode, only if JD provided
        if jd_text.strip():
            breakdown = await calculate_final_ats_breakdown(resume_text, jd_text)
            fallback_profile.ats_breakdown = breakdown
        
        return {"candidate_profile": fallback_profile.model_dump()}
