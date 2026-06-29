import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

# Mark all tests in this file as async
pytestmark = pytest.mark.asyncio(loop_scope="session")

async def test_create_session():
    # Setup test data
    payload = {
        "resume_text": "Experienced software engineer with 5 years in Python and React.",
        "jd_text": "Looking for a Full Stack Developer with Python and React experience."
    }
    
    async with AsyncClient(
        transport=ASGITransport(app=app), 
        base_url="http://testserver"
    ) as client:
        response = await client.post("/sessions", json=payload)
        
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert "next_question" in data

async def test_submit_answer():
    # First create a session
    payload = {
        "resume_text": "Experienced software engineer with 5 years in Python and React.",
        "jd_text": "Looking for a Full Stack Developer with Python and React experience."
    }
    
    async with AsyncClient(
        transport=ASGITransport(app=app), 
        base_url="http://testserver"
    ) as client:
        create_resp = await client.post("/sessions", json=payload)
        assert create_resp.status_code == 200
        session_id = create_resp.json()["session_id"]
        
        # Now submit an answer
        answer_payload = {
            "answer": "I have used Python for backend API development and React for building interactive frontends."
        }
        
        # We need a longer timeout because the LangGraph agent will process the answer via Gemini
        answer_resp = await client.post(
            f"/sessions/{session_id}/answer", 
            json=answer_payload,
            timeout=30.0
        )
        
        assert answer_resp.status_code == 200
        data = answer_resp.json()
        assert "evaluation" in data
        assert "next_question" in data or data.get("is_complete") is True
