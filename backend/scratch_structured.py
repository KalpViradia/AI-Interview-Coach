import asyncio
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import get_settings

class Question(BaseModel):
    text: str = Field(description="The question text")

async def main():
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=get_settings().gemini_api_key,
    )
    structured_llm = llm.with_structured_output(Question)
    try:
        res = await structured_llm.ainvoke("Generate a question")
        print("Success:", res)
    except Exception as e:
        print("Exception:", type(e).__name__, str(e))
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
