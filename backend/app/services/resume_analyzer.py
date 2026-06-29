"""
Resume Analyzer Service for Resume Studio.

Performs standalone analysis of a resume (without a job description)
to extract skills, determine quality, and provide improvement suggestions.
"""

import json
import logging
from typing import List, Tuple, Dict, Any

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

from app.core.config import get_settings
from app.services.ats_scoring import extract_skills_from_text, calculate_resume_quality_score
from app.schemas.resume_studio_schemas import ResumeAnalysis, ParsedResume, ExperienceEntry, EducationEntry, ProjectEntry

logger = logging.getLogger(__name__)
settings = get_settings()

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.gemini_api_key,
    temperature=0.2,
)

ANALYSIS_PROMPT = """
You are an expert technical recruiter analyzing a candidate's resume.
Your goal is to provide a comprehensive analysis of the resume content, identifying strengths, weaknesses, and actionable suggestions.

Also, structure the raw text into a ParsedResume format to the best of your ability.

Resume Text:
{resume_text}

Analyze the resume and return a JSON object strictly matching this schema:
{{
    "experience_level": "Entry Level | Mid Level | Senior Level | Executive",
    "technologies": ["React", "Python", "Docker", ...],
    "projects": ["Project Name 1", "Project Name 2", ...],
    "strengths": ["Clear impact metrics", "Strong technical stack", ...],
    "weaknesses": ["Missing active verbs", "Formatting inconsistencies", ...],
    "suggestions": ["Quantify results in the experience section", "Add a link to your GitHub", ...],
    "parsed_resume": {{
        "name": "Candidate Name",
        "headline": "Job Title or Headline",
        "email": "Email Address",
        "phone": "Phone Number",
        "location": "City, State",
        "linkedin": "LinkedIn URL",
        "github": "GitHub URL",
        "website": "Personal Website URL",
        "summary": "Professional summary...",
        "skills": ["Skill 1", "Skill 2"],
        "experience": [
            {{
                "company": "Company Name",
                "title": "Job Title",
                "dates": "Start Date - End Date",
                "location": "Location",
                "bullets": ["Achievement 1", "Achievement 2"]
            }}
        ],
        "education": [
            {{
                "institution": "University Name",
                "degree": "Degree Name",
                "field": "Field of Study",
                "dates": "Start Date - End Date",
                "gpa": "GPA",
                "details": ["Detail 1", "Detail 2"]
            }}
        ],
        "projects": [
            {{
                "name": "Project Name",
                "description": "Project Description",
                "technologies": ["Tech 1", "Tech 2"],
                "bullets": ["Bullet 1", "Bullet 2"],
                "url": "Project URL"
            }}
        ],
        "certifications": [
            {{
                "name": "Cert Name",
                "issuer": "Issuer",
                "date": "Date",
                "url": "URL"
            }}
        ],
        "achievements": ["Achievement 1", "Achievement 2"]
    }}
}}
"""

async def analyze_resume_content(resume_text: str) -> ResumeAnalysis:
    """Analyzes a resume and returns a structured ResumeAnalysis object."""
    
    # 1. Deterministic extraction
    skills = extract_skills_from_text(resume_text)
    quality_score = calculate_resume_quality_score(resume_text)
    
    # 2. AI Analysis
    try:
        prompt = ChatPromptTemplate.from_template(ANALYSIS_PROMPT)
        chain = prompt | llm
        
        response = await chain.ainvoke({"resume_text": resume_text[:6000]}) # Limit text to avoid token limits
        text = response.content.strip()
        
        # Clean up JSON if wrapped in markdown
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
            
        data = json.loads(text)
        
        # Parse the structured resume part
        parsed_data = data.get("parsed_resume", {})
        parsed_resume = ParsedResume(
            name=parsed_data.get("name", ""),
            headline=parsed_data.get("headline", ""),
            email=parsed_data.get("email", ""),
            phone=parsed_data.get("phone", ""),
            location=parsed_data.get("location", ""),
            linkedin=parsed_data.get("linkedin", ""),
            github=parsed_data.get("github", ""),
            website=parsed_data.get("website", ""),
            summary=parsed_data.get("summary", ""),
            skills=parsed_data.get("skills", []),
            experience=[ExperienceEntry(**exp) for exp in parsed_data.get("experience", [])],
            education=[EducationEntry(**edu) for edu in parsed_data.get("education", [])],
            projects=[ProjectEntry(**proj) for proj in parsed_data.get("projects", [])],
            certifications=[cert for cert in parsed_data.get("certifications", [])],
            achievements=parsed_data.get("achievements", [])
        )

        return ResumeAnalysis(
            skills=skills,
            technologies=data.get("technologies", []),
            projects=data.get("projects", []),
            experience_level=data.get("experience_level", "Not Determined"),
            quality_score=quality_score,
            strengths=data.get("strengths", []),
            weaknesses=data.get("weaknesses", []),
            suggestions=data.get("suggestions", []),
            parsed_resume=parsed_resume
        )
        
    except Exception as e:
        logger.error(f"Failed to generate analysis from Gemini: {e}")
        # Return a fallback response
        return ResumeAnalysis(
            skills=skills,
            experience_level="Unknown",
            quality_score=quality_score,
            strengths=["Could not perform detailed AI analysis due to an error."],
            weaknesses=["Resume parsing failed."],
            suggestions=["Please try again later or check your API key."]
        )
