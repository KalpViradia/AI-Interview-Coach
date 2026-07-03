/**
 * API Client — centralized HTTP client for the FastAPI backend.
 *
 * All API calls go through this module to keep endpoint URLs,
 * error handling, and auth headers in one place.
 */

import { getSession } from "next-auth/react";
import { triggerRateLimit } from "./rate-limit-event";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export class APIError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data: any) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.data = data;
  }
}

// -----------------------------------------------------------------------------
// managedFetch
// -----------------------------------------------------------------------------
/**
 * A wrapper around global fetch that previously tracked requests for WakeupManager.
 * Preserved for backwards compatibility since many files use it.
 */
export async function managedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : (input instanceof Request ? input.url : input.toString());
  return fetch(input, init);
}

/**
 * Generic fetch wrapper with error handling and automatic auth token attachment.
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit & { skipAuth?: boolean }
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };

  // If uploading a file, browser must set Content-Type with boundary automatically
  // Checking duck typing for safety across server/client contexts
  if (options?.body && typeof (options.body as any).append === "function") {
    delete headers["Content-Type"];
  }

  // Attach auth token if available (and not explicitly skipped)
  if (!options?.skipAuth) {
    try {
      // Use NextAuth's client-side session to get the JWT
      // We get the raw JWT by calling our own API route
      const jwtRes = await fetch("/api/auth/token");
      if (jwtRes.ok) {
        const { token } = await jwtRes.json();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }
    } catch {
      // No token available — proceed as guest
    }
  }

  const { skipAuth: _skipAuth, ...fetchOptions } = options || {};

  const response = await managedFetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const detail = error.detail || error;
    const message = typeof detail === 'string' 
      ? detail 
      : (detail?.message || `API error: ${response.status} ${response.statusText}`);

    if (response.status === 429) {
      const retryAfter = detail?.retry_after || 20;
      return new Promise<T>((resolve, reject) => {
        triggerRateLimit(
          retryAfter,
          message || "The AI service is temporarily busy. Please try again.",
          () => {
            // Retry the same request recursively
            apiFetch<T>(endpoint, options).then(resolve).catch(reject);
          },
          () => {
            // Cancel and propagate error
            reject(new APIError(response.status, message, detail));
          }
        );
      });
    }

    throw new APIError(response.status, message, detail);
  }

  return response.json();
}

/**
 * Health check — verify backend is reachable.
 */
export async function healthCheck() {
  const url = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api") + "/health";
  const response = await managedFetch(url);
  if (!response.ok) throw new Error("Health check failed");
  return response.json();
}

// Types based on backend schemas
export interface Question {
  text: string;
  topic: string;
  difficulty: number;
}

export interface Evaluation {
  question: string;
  answer: string;
  score?: number;
  strengths: string[];
  weaknesses: string[];
  suggestion: string;
  ideal_answer?: string;
}

export interface SessionReport {
  score: number;
  technical_score?: number;
  communication_score?: number;
  problem_solving_score?: number;
  readiness_label: string;
  summary: string;
  strong_topics?: string[];
  weak_topics: string[];
  roadmap: string[];
}

export interface ATSBreakdown {
  overall_score: number;
  skill_score: number;
  semantic_score: number;
  experience_score: number;
  quality_score: number;
  explanation: string;
  matched_skills: string[];
  missing_skills: string[];
  improvement_suggestions: string[];
}

export interface CandidateProfile {
  skills: string[];
  projects: string[];
  experience_level: string;
  experience_details?: string;
  gaps_vs_jd: string[];
  ats_breakdown?: ATSBreakdown;
}

export interface SessionCreateResponse {
  session_id: string;
  candidate_profile?: CandidateProfile;
  next_question?: Question;
}

export interface AnswerSubmitResponse {
  evaluation?: Evaluation;
  next_question?: Question;
  report?: SessionReport;
  is_complete: boolean;
}

export const createSession = async (resumeText: string, jdText: string): Promise<SessionCreateResponse> => {
  return apiFetch<SessionCreateResponse>("/sessions", {
    method: "POST",
    body: JSON.stringify({
      resume_text: resumeText,
      jd_text: jdText,
    }),
  });
};

export async function submitAnswer(sessionId: string, answer: string): Promise<AnswerSubmitResponse> {
  return apiFetch<AnswerSubmitResponse>(`/sessions/${sessionId}/answer`, {
    method: "POST",
    body: JSON.stringify({ answer }),
  });
}

export interface SessionStateResponse {
  session_id: string;
  next_question?: Question;
  turn_count: number;
  is_complete: boolean;
  status: string;
  session_type: "ats_check" | "mock_interview" | "general" | "resume_based" | "job_specific";
  report?: SessionReport;
  candidate_profile?: CandidateProfile;
}

export async function getSessionState(sessionId: string): Promise<SessionStateResponse> {
  return apiFetch<SessionStateResponse>(`/sessions/${sessionId}`);
}

export interface TranscriptTurn {
  question: string;
  topic: string;
  difficulty: number;
  order_index: number;
  answer: string | null;
  evaluation: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    feedback: string;
  } | null;
}

export async function getSessionTranscript(sessionId: string): Promise<TranscriptTurn[]> {
  return apiFetch<TranscriptTurn[]>(`/sessions/${sessionId}/transcript`);
}

export async function getSessions(): Promise<SessionStateResponse[]> {
  return apiFetch<SessionStateResponse[]>("/sessions");
}

export async function uploadDocument(file: File, docType: 'resume' | 'jd' = 'resume'): Promise<{ text: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("doc_type", docType);
  
  const url = `${API_BASE_URL}/parse-document`;

  // Get auth token for upload too
  const headers: Record<string, string> = {};
  try {
    const jwtRes = await fetch("/api/auth/token");
    if (jwtRes.ok) {
      const { token } = await jwtRes.json();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
  } catch {
    // Proceed without auth
  }

  const response = await managedFetch(url, {
    method: "POST",
    body: formData,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const detail = error.detail || error;
    const message = typeof detail === 'string' 
      ? detail 
      : (detail?.message || `API error: ${response.status} ${response.statusText}`);

    if (response.status === 429) {
      const retryAfter = detail?.retry_after || 20;
      return new Promise<{ text: string }>((resolve, reject) => {
        triggerRateLimit(
          retryAfter,
          message || "The AI service is temporarily busy. Please try again.",
          () => {
            uploadDocument(file, docType).then(resolve).catch(reject);
          },
          () => {
            reject(new APIError(response.status, message, detail));
          }
        );
      });
    }

    throw new APIError(response.status, message, detail);
  }

  return response.json();
}

/**
 * Register a new user via the backend API.
 */
export async function registerUser(name: string, email: string, password: string) {
  return apiFetch<{ id: string; email: string; name: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
    skipAuth: true, // Registration doesn't need auth
  });
}

// -----------------------------------------------------------------------------
// User Profile APIs
// -----------------------------------------------------------------------------

export interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  created_at: string;
  avatar_url?: string;
  
  // Stats
  resume_count: number;
  interviews_taken: number;
  ats_checks_run: number;
  average_score?: number;
}

export async function getMyProfile(): Promise<UserProfileResponse> {
  return apiFetch<UserProfileResponse>("/users/me");
}

// -----------------------------------------------------------------------------
// Resume Vault APIs
// -----------------------------------------------------------------------------

export interface ResumeResponse {
  id: string;
  display_name: string;
  original_filename: string;
  created_at: string;
  last_used: string;
  file_size: number;
  interview_count: number;
  cloudinary_url?: string;
}

export interface ResumeDetailResponse extends ResumeResponse {
  extracted_text: string;
  parsed_json?: ParsedResume;
  ats_checks: number;
  mock_interviews: number;
  voice_interviews: number;
  resume_chats: number;
  average_score?: number;
}

export async function getResumes(): Promise<ResumeResponse[]> {
  return apiFetch<ResumeResponse[]>("/resumes");
}

export async function uploadForResumeChat(file: File): Promise<{ session_id: string, message: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const url = `${API_BASE_URL}/resume-chat/upload`;
  const headers: Record<string, string> = {};
  try {
    const jwtRes = await fetch("/api/auth/token");
    if (jwtRes.ok) {
      const { token } = await jwtRes.json();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
  } catch {}

  const response = await managedFetch(url, {
    method: "POST",
    body: formData,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const detail = error.detail || error;
    const message = typeof detail === 'string' 
      ? detail 
      : (detail?.message || `API error: ${response.status} ${response.statusText}`);
    throw new APIError(response.status, message, detail);
  }

  return response.json();
}

export async function uploadToVault(file: File, displayName?: string): Promise<ResumeResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (displayName) {
    formData.append("display_name", displayName);
  }

  const url = `${API_BASE_URL}/resumes`;
  const headers: Record<string, string> = {};
  try {
    const jwtRes = await fetch("/api/auth/token");
    if (jwtRes.ok) {
      const { token } = await jwtRes.json();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
  } catch {}

  const response = await managedFetch(url, {
    method: "POST",
    body: formData,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const detail = error.detail || error;
    const message = typeof detail === 'string' 
      ? detail 
      : (detail?.message || `API error: ${response.status} ${response.statusText}`);
    throw new APIError(response.status, message, detail);
  }

  return response.json();
}

export async function getResumeDetails(resumeId: string): Promise<ResumeDetailResponse> {
  return apiFetch<ResumeDetailResponse>(`/resumes/${resumeId}`);
}

export async function renameResume(resumeId: string, displayName: string): Promise<ResumeResponse> {
  return apiFetch<ResumeResponse>(`/resumes/${resumeId}`, {
    method: "PATCH",
    body: JSON.stringify({ display_name: displayName }),
  });
}



export async function deleteResume(resumeId: string): Promise<void> {
  await apiFetch(`/resumes/${resumeId}`, { method: "DELETE" });
}

export async function downloadResume(resumeId: string, filename: string): Promise<void> {
  const jwtRes = await fetch("/api/auth/token");
  const { token } = await jwtRes.json();
  
  const res = await managedFetch(`${API_BASE_URL}/resumes/${resumeId}/download`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!res.ok) {
    throw new Error("Failed to download resume");
  }
  
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  
  // Replace .pdf with .txt since backend only stores raw text unless we have cloudinary
  let finalFilename = filename;
  if (finalFilename.toLowerCase().endsWith('.pdf')) {
    finalFilename = finalFilename.substring(0, finalFilename.length - 4) + '.txt';
  }
  a.download = finalFilename;
  
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

// -----------------------------------------------------------------------------
// Resume Studio APIs
// -----------------------------------------------------------------------------

export interface ResumeSection {
  name: string;
  content: string;
  order: number;
}

export interface ExperienceEntry {
  company: string;
  title: string;
  dates: string;
  location: string;
  bullets: string[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  dates: string;
  gpa: string;
  details: string[];
}

export interface ProjectEntry {
  name: string;
  description: string;
  technologies: string[];
  bullets: string[];
  url: string;
}

export interface CertificationEntry {
  name: string;
  issuer: string;
  date: string;
  url: string;
}

export interface ParsedResume {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
  summary: string;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  achievements: string[];
}

export interface ResumeAnalysis {
  skills: string[];
  technologies: string[];
  projects: string[];
  experience_level: string;
  quality_score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  parsed_resume?: ParsedResume;
}

export async function analyzeResume(resumeId: string): Promise<ResumeAnalysis> {
  return apiFetch<ResumeAnalysis>(`/resumes/${resumeId}/analyze`);
}

export async function runATSCheck(resumeId: string, jdText: string): Promise<ATSBreakdown> {
  return apiFetch<ATSBreakdown>(`/resumes/${resumeId}/ats-check`, {
    method: "POST",
    body: JSON.stringify({ jd_text: jdText }),
  });
}

// ─── Config API ────────────────────────────────────────────────────────────

export interface AppConfig {
  speech_provider: string;
  whisper_available: boolean;
  supported_providers: string[];
}

export async function getConfig(): Promise<AppConfig> {
  return apiFetch<AppConfig>("/config");
}

/**
 * Optimizes a Cloudinary image URL for avatars
 */
export function getOptimizedAvatarUrl(url?: string): string {
  if (!url) return "";
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    if (!url.includes("/upload/q_auto")) {
      return url.replace("/upload/", "/upload/q_auto,f_auto,w_256,h_256,c_fill/");
    }
  }
  return url;
}
