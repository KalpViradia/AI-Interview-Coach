import re
import json
import logging
from typing import List, Dict, Any, Tuple
from sentence_transformers import SentenceTransformer, util
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import get_settings
from app.schemas.agent_schemas import ATSBreakdown, CandidateProfile

logger = logging.getLogger(__name__)

# Lazily load Sentence Transformer Model to avoid OOM on startup
_embedder = None
def get_embedder():
    global _embedder
    if _embedder is None:
        try:
            logger.info("Loading sentence-transformers model: all-MiniLM-L6-v2")
            _embedder = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            logger.error(f"Failed to load sentence-transformers: {e}")
            _embedder = False # False means failed to load
    return _embedder if _embedder is not False else None

settings = get_settings()

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.gemini_api_key,
    temperature=0.3,
)

COMMON_SKILLS = [
    "python", "java", "c++", "c#", "go", "golang", "javascript", "typescript", "react", "next.js", "angular", "vue",
    "node.js", "express", "django", "flask", "fastapi", "spring boot", "ruby on rails", "php", "laravel",
    "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "ansible", "jenkins", "github actions",
    "postgres", "postgresql", "sql", "mysql", "oracle", "sql server", "sqlite",
    "nosql", "redis", "mongodb", "cassandra", "dynamodb", "elasticsearch",
    "kafka", "rabbitmq", "activemq", "spark", "hadoop", "airflow", "snowflake", "databricks",
    "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn", "keras", "xgboost",
    "nlp", "natural language processing", "computer vision", "recommendation systems", "data visualization",
    "pandas", "numpy", "matplotlib", "seaborn", "statistics", "feature engineering", "mlops",
    "html", "css", "tailwind", "sass", "less", "redux", "graphql", "rest", "api", "git", "linux", "agile", "scrum"
]

def extract_skills_from_text(text: str) -> List[str]:
    """Helper to extract common tech skills from raw text."""
    text_lower = text.lower()
    found = []
    for skill in COMMON_SKILLS:
        # Use simple word boundary check for short skills to avoid partial matches
        if len(skill) <= 3:
            if re.search(r'\b' + re.escape(skill) + r'\b', text_lower):
                found.append(skill.title() if skill != "api" and skill != "aws" and skill != "gcp" and skill != "sql" else skill.upper())
        else:
            if skill in text_lower:
                found.append(skill.title())
    return list(set(found))

def extract_jd_requirements(jd_text: str) -> List[str]:
    return extract_skills_from_text(jd_text)

def extract_resume_skills(resume_text: str) -> List[str]:
    return extract_skills_from_text(resume_text)

def calculate_skill_score(resume_text: str, jd_text: str) -> Tuple[int, List[str], List[str]]:
    """Calculates skill match score (max 30 points)."""
    jd_skills = extract_jd_requirements(jd_text)
    resume_skills = extract_resume_skills(resume_text)
    
    if not jd_skills:
        # If no skills identified in JD, give full marks if resume has any skills, otherwise half
        return (30 if resume_skills else 15, resume_skills, [])
        
    matched = [s for s in jd_skills if s in resume_skills]
    missing = [s for s in jd_skills if s not in resume_skills]
    
    score = int((len(matched) / len(jd_skills)) * 30)
    return (min(30, max(0, score)), matched, missing)

def calculate_semantic_score(resume_text: str, jd_text: str) -> int:
    """Calculates semantic similarity between resume and JD (max 40 points)."""
    embedder = get_embedder()
    if not embedder:
        return 20 # Fallback if model failed to load
        
    try:
        # Truncate texts to avoid token limit issues
        res_emb = embedder.encode(resume_text[:4000], convert_to_tensor=True)
        jd_emb = embedder.encode(jd_text[:4000], convert_to_tensor=True)
        
        # Calculate cosine similarity
        cosine_scores = util.cos_sim(res_emb, jd_emb)
        sim = float(cosine_scores[0][0].item())
        
        # Map similarity to a 0-40 scale. Typically cosine sim is > 0.4 for any related text.
        # Let's map 0.3 - 0.8 to 0 - 40 points.
        normalized = (sim - 0.3) / 0.5
        score = int(normalized * 40)
        return min(40, max(0, score))
    except Exception as e:
        logger.error(f"Semantic scoring failed: {e}")
        return 20

def calculate_experience_score(resume_text: str, jd_text: str) -> int:
    """Calculates experience score (max 15 points) based on simple year extraction."""
    # Try to find "X+ years", "X years", etc in JD
    jd_years = 0
    jd_matches = re.findall(r'(\d+)(?:\+|-)?\s*years?', jd_text.lower())
    if jd_matches:
        try:
            jd_years = max([int(m) for m in jd_matches if int(m) < 20])
        except:
            pass
            
    # Try to find years in resume
    res_years = 0
    res_matches = re.findall(r'(\d+)(?:\+|-)?\s*years?', resume_text.lower())
    if res_matches:
        try:
            res_years = max([int(m) for m in res_matches if int(m) < 40])
        except:
            pass
            
    if jd_years == 0:
        return 15 # No explicit experience requirement found
        
    if res_years >= jd_years:
        return 15
        
    # Partial score
    score = int((res_years / jd_years) * 15)
    return min(15, max(0, score))

def calculate_resume_quality_score(resume_text: str) -> int:
    """Calculates resume structure quality (max 15 points)."""
    text = resume_text.lower()
    
    sections = {
        "education": ["education", "university", "bachelor", "master", "degree", "b.tech", "b.s."],
        "experience": ["experience", "employment", "work history"],
        "skills": ["skills", "technologies", "core competencies"],
        "projects": ["projects", "personal projects", "portfolio"],
        "contact": ["email", "github.com", "linkedin.com", "phone", "@"]
    }
    
    found_sections = 0
    for section, keywords in sections.items():
        if any(kw in text for kw in keywords):
            found_sections += 1
            
    # Each section is worth 3 points
    return found_sections * 3

async def explain_ats_score(
    overall_score: int, 
    skill_score: int, 
    semantic_score: int, 
    experience_score: int, 
    quality_score: int, 
    matched_skills: List[str], 
    missing_skills: List[str]
) -> Tuple[str, List[str]]:
    """Uses Gemini to explain the score and provide suggestions."""
    
    prompt = f"""
    You are an expert technical recruiter analyzing an ATS score.
    The candidate received an ATS match score of {overall_score}/100.
    
    Score Breakdown:
    - Skill Match: {skill_score}/30
    - Semantic Match: {semantic_score}/40
    - Experience Match: {experience_score}/15
    - Resume Quality: {quality_score}/15
    
    Matched Skills: {", ".join(matched_skills) if matched_skills else "None"}
    Missing Skills: {", ".join(missing_skills) if missing_skills else "None"}
    
    Based on these metrics, provide:
    1. A short, professional paragraph explaining why they got this score (focusing on strengths and gaps).
    2. A list of 2-3 specific, actionable suggestions to improve their resume for this job.
    
    Return the response in strictly this JSON format:
    {{
        "explanation": "string",
        "suggestions": ["string", "string"]
    }}
    """
    
    try:
        response = await llm.ainvoke(prompt)
        text = response.content.strip()
        
        # Clean up JSON if wrapped in markdown
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
            
        data = json.loads(text)
        return (data.get("explanation", "Score calculated successfully."), data.get("suggestions", []))
    except Exception as e:
        logger.error(f"Failed to generate explanation from Gemini: {e}")
        return ("Your resume was evaluated against the JD based on skills, semantic match, experience, and overall quality.", ["Tailor your resume to match the exact skills in the JD.", "Ensure your experience section clearly highlights accomplishments."])

async def calculate_final_ats_breakdown(resume_text: str, jd_text: str) -> ATSBreakdown:
    """Main entrypoint to run the entire ATS hybrid scoring engine."""
    
    skill_score, matched, missing = calculate_skill_score(resume_text, jd_text)
    semantic_score = calculate_semantic_score(resume_text, jd_text)
    exp_score = calculate_experience_score(resume_text, jd_text)
    quality_score = calculate_resume_quality_score(resume_text)
    
    overall_score = skill_score + semantic_score + exp_score + quality_score
    
    explanation, suggestions = await explain_ats_score(
        overall_score, skill_score, semantic_score, exp_score, quality_score, matched, missing
    )
    
    return ATSBreakdown(
        overall_score=overall_score,
        skill_score=skill_score,
        semantic_score=semantic_score,
        experience_score=exp_score,
        quality_score=quality_score,
        explanation=explanation,
        matched_skills=matched,
        missing_skills=missing,
        improvement_suggestions=suggestions
    )
