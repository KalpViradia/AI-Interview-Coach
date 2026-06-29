"""
SQLAlchemy ORM models — maps to PostgreSQL schema.

Tables: users, resumes, job_descriptions, sessions, questions, answers, evaluations, reports
Uses JSONB for *_json columns (Postgres-native).
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Text, DateTime, ForeignKey, Enum
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False, default="Demo User")
    target_role = Column(String(255), default="")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    job_descriptions = relationship("JobDescription", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("InterviewSession", back_populates="user", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    display_name = Column(String(255), default="My Resume")
    original_filename = Column(String(255), default="resume.pdf")
    raw_text = Column(Text, nullable=False)
    parsed_json = Column(JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_used = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    file_size = Column(Integer, default=0)
    
    # Relationships
    user = relationship("User", back_populates="resumes")
    sessions = relationship("InterviewSession", back_populates="resume", cascade="all, delete-orphan")


class JobDescription(Base):
    __tablename__ = "job_descriptions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    raw_text = Column(Text, nullable=False)
    parsed_json = Column(JSONB, default=dict)
    
    # Relationships
    user = relationship("User", back_populates="job_descriptions")


class InterviewSession(Base):
    __tablename__ = "sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id"), nullable=True)
    jd_id = Column(UUID(as_uuid=True), ForeignKey("job_descriptions.id"), nullable=True)
    status = Column(String(50), default="in_progress")  # in_progress, completed
    session_type = Column(String(50), default="ats_check") # ats_check, mock_interview
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    resume = relationship("Resume", back_populates="sessions")
    questions = relationship("Question", back_populates="session", cascade="all, delete-orphan")
    report = relationship("Report", back_populates="session", uselist=False, cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    text = Column(Text, nullable=False)
    topic = Column(String(100), default="General")
    difficulty = Column(Integer, default=1)
    order_index = Column(Integer, default=0)
    
    # Relationships
    session = relationship("InterviewSession", back_populates="questions")
    answer = relationship("Answer", back_populates="question", uselist=False, cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id"), nullable=False)
    text = Column(Text, nullable=False)
    submitted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    question = relationship("Question", back_populates="answer")
    evaluation = relationship("AnswerEvaluation", back_populates="answer", uselist=False, cascade="all, delete-orphan")


class AnswerEvaluation(Base):
    __tablename__ = "evaluations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    answer_id = Column(UUID(as_uuid=True), ForeignKey("answers.id"), nullable=False)
    score = Column(Float, nullable=True)
    strengths_json = Column(JSONB, default=list)
    weaknesses_json = Column(JSONB, default=list)
    feedback = Column(Text, default="")
    
    # Relationships
    answer = relationship("Answer", back_populates="evaluation")


class Report(Base):
    __tablename__ = "reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    summary_json = Column(JSONB, default=dict)
    weak_topics_json = Column(JSONB, default=list)
    roadmap_json = Column(JSONB, default=list)
    readiness_label = Column(String(100), default="")
    
    # Relationships
    session = relationship("InterviewSession", back_populates="report")
