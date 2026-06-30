import asyncio
from google import genai
from app.core.config import get_settings

async def main():
    try:
        client = genai.Client(api_key=get_settings().gemini_api_key)
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents="hi"
        )
        print("Success:", response.text)
    except Exception as e:
        print("Exception:", type(e).__name__, str(e))
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
