"""
Resume Studio Pydantic schemas — typed models for the Resume Studio API.

Provides structured data models for resume analysis, parsing, optimization,
and export functionality.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ResumeSection(BaseModel):
    """A single section of a parsed resume."""
    name: str
    content: str
    order: int = 0


class ExperienceEntry(BaseModel):
    """A single work experience entry."""
    company: str = ""
    title: str = ""
    dates: str = ""
    location: str = ""
    bullets: List[str] = Field(default_factory=list)


class EducationEntry(BaseModel):
    """A single education entry."""
    institution: str = ""
    degree: str = ""
    field: str = ""
    dates: str = ""
    gpa: str = ""
    details: List[str] = Field(default_factory=list)


class ProjectEntry(BaseModel):
    """A single project entry."""
    name: str = ""
    description: str = ""
    technologies: List[str] = Field(default_factory=list)
    bullets: List[str] = Field(default_factory=list)
    url: str = ""


class CertificationEntry(BaseModel):
    """A single certification entry."""
    name: str = ""
    issuer: str = ""
    date: str = ""
    url: str = ""


class ParsedResume(BaseModel):
    """Fully structured representation of a resume."""
    name: str = ""
    headline: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""
    website: str = ""
    summary: str = ""
    skills: List[str] = Field(default_factory=list)
    experience: List[ExperienceEntry] = Field(default_factory=list)
    education: List[EducationEntry] = Field(default_factory=list)
    projects: List[ProjectEntry] = Field(default_factory=list)
    certifications: List[CertificationEntry] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)


class ResumeAnalysis(BaseModel):
    """Result of AI-powered resume analysis."""
    skills: List[str] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)
    projects: List[str] = Field(default_factory=list)
    experience_level: str = "Not Determined"
    quality_score: int = 0
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    parsed_resume: Optional[ParsedResume] = None


class OptimizeRequest(BaseModel):
    """Request to optimize a section of the resume."""
    action: str  # improve_summary, rewrite_bullets, quantify_achievements, improve_ats_keywords, make_concise, better_action_verbs
    section_text: str
    context: str = ""  # Optional context like job description


class OptimizeResponse(BaseModel):
    """Response from the AI optimizer."""
    original: str
    improved: str
    action: str
    changes_summary: str = ""


class ATSCheckRequest(BaseModel):
    """Request for ATS check within Resume Studio."""
    jd_text: str


class ExportRequest(BaseModel):
    """Request to export a resume."""
    format: str  # pdf, docx, html, markdown, json
    template: str = "modern"  # template name


class ResumeVersionResponse(BaseModel):
    """A version snapshot of a resume."""
    id: str
    version_number: int
    created_at: str
    change_summary: str = ""


class ResumeInsights(BaseModel):
    """Aggregated resume usage insights."""
    mock_interviews: int = 0
    voice_interviews: int = 0
    ats_checks: int = 0
    resume_chats: int = 0
    average_ats_score: Optional[float] = None
    average_interview_score: Optional[float] = None
    most_requested_skills: List[str] = Field(default_factory=list)
    last_used: Optional[str] = None
    resume_readiness: str = "Not Assessed"
