import asyncio
from app.rag.resume_chat import rag_service
from app.core.config import get_settings

async def main():
    try:
        # Provide a dummy session ID and query
        answer = await rag_service.answer_query("test-session-id", "can you give me example of BERT models outside my project")
        print("Success:", answer)
    except Exception as e:
        print("Exception occurred:", type(e).__name__)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
