import requests
import json

base_url = "http://localhost:8000/api/sessions"
print("Creating session...")
res = requests.post(base_url, json={
    "interview_type": "job_specific",
    "resume_text": "Sample resume text for John Doe software engineer",
    "jd_text": "Sample JD text for AI ML Engineer role",
    "resume_id": ""
})
session_id = res.json().get("session_id")
print("Session ID:", session_id)

print("\nSubmitting answer...")
answer_url = f"{base_url}/{session_id}/answer"
res2 = requests.post(answer_url, json={
    "answer_text": "I used semantic search with BERT embeddings to match the resume with the JD.",
    "is_final": False
})
print("Answer Status:", res2.status_code)
print("Answer Response:", res2.text)
