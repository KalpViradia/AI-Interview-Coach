import sys
import asyncio
import uvicorn

if __name__ == "__main__":
    if sys.platform == "win32":
        # psycopg3 requires WindowsSelectorEventLoopPolicy for async operations.
        # Uvicorn's reload=True spawns a subprocess that creates a ProactorEventLoop 
        # before this script can set the policy. Thus, we must disable reload on Windows.
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
    else:
        uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
